import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ObjectId } from 'mongodb';
import { REDIS } from '../common/redis/redis.module';
import { splitTextIntoChunksOnLines } from '../importers/chunker';
import { UserSparse } from '../user/user.schema';
import { UserService } from '../user/user.service';
import { OpenaiChatbotService } from './chatbot/openaiChatbotService';
import { CustomKeyService } from './custom-key.service';
import { KnowledgebaseDbService } from './knowledgebase-db.service';
import {
  checkUserPermissionForKb,
  UserPermissions,
} from './knowledgebase-utils';
import { AddCustomChunkDTO } from './knowledgebase.dto';
import {
  CHUNK_SIZE,
  Chunk,
  ChunkStatus,
  DataStoreStatus,
  DataStoreType,
  KbDataStore,
} from './knowledgebase.schema';

function getEmbeddingsCacheKey(kbId: ObjectId): string {
  return `e_${kbId.toHexString()}`;
}

@Injectable()
export class DataStoreService {
  constructor(
    private kbDbService: KnowledgebaseDbService,
    private openaiChatbotService: OpenaiChatbotService,
    private readonly userService: UserService,
    private readonly customKeyService: CustomKeyService,
    @Inject(REDIS) private redis: Redis,
  ) {}

  private async clearEmbeddingsCacheForKnowledgebase(kbId: ObjectId) {
    const cacheKey = getEmbeddingsCacheKey(kbId);
    this.redis.del(cacheKey);
  }

  

  async generateChunksAndEmbeddingsForDataStoreItem(dsItem: KbDataStore) {
    
    if (dsItem.status === DataStoreStatus.TRAINED || !dsItem.content) {
      return;
    }

    let dsItemChunks: Chunk[] = [];

    if (dsItem.status === DataStoreStatus.CREATED) {
      
      const chunks = splitTextIntoChunksOnLines(dsItem.content, CHUNK_SIZE);

      const ts = new Date();
      const chunksToInsert: Chunk[] = chunks.map((c) => ({
        url: dsItem.url,
        title: dsItem.title,
        chunk: c,
        knowledgebaseId: dsItem.knowledgebaseId,
        dataStoreId: dsItem._id,
        status: ChunkStatus.CREATED,
        type: dsItem.type,
        createdAt: ts,
        updatedAt: ts,
      }));
      const chunkIds = await this.kbDbService.insertChunksBulk(chunksToInsert);

      
      await this.kbDbService.updateKbDataStoreItem(dsItem._id, {
        status: DataStoreStatus.CHUNKED,
      });

      for (let i = 0; i < chunksToInsert.length; i++) {
        const chunk = {
          _id: chunkIds[i],
          ...chunksToInsert[i],
        };
        dsItemChunks.push(chunk);
      }
    } else {
      
      
      const dsItemChunksIdDocs =
        await this.kbDbService.getChunksForDataStoreItem(dsItem._id);
      const dsItemChunksIds = dsItemChunksIdDocs.map((d) => d._id);
      dsItemChunks = await this.kbDbService.getChunkByIdBulk(dsItemChunksIds);
    }

    
    const kb = await this.kbDbService.getKnowledgebaseById(
      dsItem.knowledgebaseId,
    );
    
    const user = await this.userService.findUserById(kb.owner.toHexString());

    
    for (const chunk of dsItemChunks) {
      if (chunk.status === ChunkStatus.EMBEDDING_GENERATED) continue;
      await this.openaiChatbotService.addEmbeddingsForChunk(
        dsItem.knowledgebaseId,
        chunk,
        user.customKeys,
        kb.embeddingModel,
      );
      console.log(`Added embedding for ${chunk.title}`);
    }

    
    await Promise.all([
      this.kbDbService.updateKbDataStoreItem(dsItem._id, {
        status: DataStoreStatus.TRAINED,
      }),
      this.clearEmbeddingsCacheForKnowledgebase(dsItem.knowledgebaseId),
    ]);
  }

  

  async insertToDataStoreAndCreateEmbeddings(data: KbDataStore) {
    
    const dsItem = await this.kbDbService.insertToKbDataStore(data);

    await this.generateChunksAndEmbeddingsForDataStoreItem(dsItem);

    return dsItem;
  }

  

  async updateDataStoreContentAndCreateEmbeddings(
    id: ObjectId,
    data: Pick<KbDataStore, 'content' | 'title'>,
  ) {
    
    const dsItem = await this.kbDbService.getKbDataStoreItemById(id);

    
    const chunks = await this.kbDbService.getChunksForDataStoreItem(id);
    const chunkIds = chunks.map((c) => c._id);

    
    await this.kbDbService.updateKbDataStoreItem(id, {
      ...data,
      status: DataStoreStatus.CREATED,
    });
    dsItem.status = DataStoreStatus.CREATED;
    dsItem.content = data.content;
    dsItem.title = data.title;

    await this.generateChunksAndEmbeddingsForDataStoreItem(dsItem);

    
    await Promise.all([
      this.kbDbService.deleteEmbeddingsByIdBulk(chunkIds),
      this.kbDbService.deleteChunksByIdBulk(chunkIds),
    ]);
  }

  

  async deleteDataStoreItemAndAssociatedEmbeddings(id: ObjectId) {
    const dsItem = await this.kbDbService.getKbDataStoreItemById(id);

    
    const chunks = await this.kbDbService.getChunksForDataStoreItem(id);
    const chunkIds = chunks.map((c) => c._id);

    
    await this.kbDbService.deleteEmbeddingsByIdBulk(chunkIds);

    
    await this.kbDbService.deleteChunksByIdBulk(chunkIds);

    
    await this.kbDbService.deleteKbDataStoreItem(id);

    
    await this.clearEmbeddingsCacheForKnowledgebase(dsItem.knowledgebaseId);
  }

  

  

  async addCustomDataToKnowledgebase(
    user: UserSparse,
    knowledgebaseId: string,
    data: AddCustomChunkDTO,
  ) {
    const kbId = new ObjectId(knowledgebaseId);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    const ts = new Date();

    
    let dsItem: KbDataStore = {
      knowledgebaseId: kbId,
      title: data.q,
      content: data.a,
      type: DataStoreType.CUSTOM,
      status: DataStoreStatus.CREATED,
      createdAt: ts,
      updatedAt: ts,
    };

    dsItem = await this.insertToDataStoreAndCreateEmbeddings(dsItem);
    return dsItem;
  }

  

  async getDataStoreItemDetail(
    user: UserSparse,
    knowledgebaseId: string,
    dataStoreId: string,
  ) {
    const kbId = new ObjectId(knowledgebaseId);
    const dId = new ObjectId(dataStoreId);

    
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.READ]);

    const dsItem = await this.kbDbService.getKbDataStoreItemById(dId);
    if (!dsItem || !dsItem.knowledgebaseId.equals(kbId)) {
      throw new HttpException('Invalid DataStore Id', HttpStatus.UNAUTHORIZED);
    }

    return dsItem;
  }

  

  async listDataStoreItemsInKnowledgebase(
    user: UserSparse,
    knowledgebaseId: string,
    pageSize: number,
    type?: DataStoreType,
    page?: number,
  ) {
    const kbId = new ObjectId(knowledgebaseId);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.READ]);

    return this.kbDbService.getPaginatedDataStoreItemsForKnowledgebase(
      kbId,
      pageSize,
      type,
      page,
    );
  }

  async deleteDataStoreItemFromKnowledgebase(
    user: UserSparse,
    knowledgebaseId: string,
    dataStoreId: string,
  ) {
    const kbId = new ObjectId(knowledgebaseId);
    const dId = new ObjectId(dataStoreId);

    
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);
    const dsItem = await this.kbDbService.getKbDataStoreItemById(dId);
    if (!dsItem.knowledgebaseId.equals(kbId)) {
      throw new HttpException('Invalid DataStore Id', HttpStatus.UNAUTHORIZED);
    }

    await this.deleteDataStoreItemAndAssociatedEmbeddings(dId);
  }

  async updateDataStoreItemForKnowledgebase(
    user: UserSparse,
    knowledgebaseId: string,
    dataStoreId: string,
    data: AddCustomChunkDTO,
  ) {
    const kbId = new ObjectId(knowledgebaseId);
    const dId = new ObjectId(dataStoreId);

    
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);
    const dsItem = await this.kbDbService.getKbDataStoreItemById(dId);
    if (!dsItem.knowledgebaseId.equals(kbId)) {
      throw new HttpException('Invalid DataStore Id', HttpStatus.UNAUTHORIZED);
    }

    await this.updateDataStoreContentAndCreateEmbeddings(dId, {
      title: data.q,
      content: data.a,
    });
  }
}
