import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { isAdmin } from '../auth/guards/role.enum';
import {
  CELERY_CLIENT,
  CeleryClientQueue,
  CeleryClientService,
} from '../common/celery/celery-client.module';
import { CrawlConfig } from '../importers/crawler/crawlee/crawler.types';
import { SubscriptionPlanInfoService } from '../subscription/subscription-plan.service';
import { SubscriptionPlanInfo } from '../subscription/subscription.const';
import { Subscription, UserSparse } from '../user/user.schema';
import { DEFAULT_CHATGPT_PROMPT } from './chatbot/openaiChatbot.constant';
import { KnowledgebaseDbService } from './knowledgebase-db.service';
import {
  checkUserPermissionForKb,
  UserPermissions,
} from './knowledgebase-utils';
import {
  CreateKnowledgebaseDTO,
  InviteUserDTO,
  UpdateKnowledgebaseWebsiteDataDTO,
} from './knowledgebase.dto';
import {
  CustomKeyData,
  DataStoreType,
  EmbeddingModel,
  Knowledgebase,
  KnowledgebaseStatus,
  ParticipantsData,
  UserRoles,
} from './knowledgebase.schema';
import { CustomKeyService } from './custom-key.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class KnowledgebaseService {
  constructor(
    @Inject(CELERY_CLIENT) private celeryClient: CeleryClientService,
    private kbDbService: KnowledgebaseDbService,
    private subPlanInfoService: SubscriptionPlanInfoService,
    private customKeyService: CustomKeyService,
    private readonly userService: UserService,
    private emailService: EmailService,
  ) {}

  

  

  private isParentPath(parentPath: string, childPath: string): boolean {
    
    const normalizePathForComparison = (p: string) => {
      if (!p.startsWith('/')) p = '/' + p;
      return p.replace(/\/+$/, '');
    };

    const normalizedParent = normalizePathForComparison(parentPath);
    const normalizedChild = normalizePathForComparison(childPath);

    
    
    
    
    return normalizedChild.startsWith(normalizedParent) &&
           normalizedChild.length > normalizedParent.length &&
           normalizedChild.charAt(normalizedParent.length) === '/';
  }

  private async crawlWebsiteForKb(
    kbId: ObjectId,
    websiteData: Knowledgebase['websiteData'],
    maxPages: number,
    useAlternateParser = false,
  ) {
    const baseUrl = new URL(websiteData.websiteUrl).origin;

    const includeUrlsForInit = websiteData.include.map((u) => `${baseUrl}${u}`);

    
    const includePatterns = websiteData.include.flatMap((u) => [
      `${baseUrl}${u}`,
      `${baseUrl}${u}/**/*`,
    ]);

    
    let excludePatterns = [];

    
    websiteData.exclude.forEach((excludePath) => {
      
      const isSubdirOfIncludedPath = websiteData.include.some((includePath) =>
        this.isParentPath(includePath, excludePath)
      );

      
      excludePatterns.push(`${baseUrl}${excludePath}`);
      excludePatterns.push(`${baseUrl}${excludePath}/**/*`);

      
      
      if (isSubdirOfIncludedPath) {
        excludePatterns.push(`${baseUrl}${excludePath}/*`);
        excludePatterns.push(`${baseUrl}${excludePath}/**`);
      }
    });

    const data: CrawlConfig = {
      urls: [
        websiteData.websiteUrl,
        ...websiteData.urls,
        ...includeUrlsForInit,
      ],
      include: includePatterns,
      exclude: excludePatterns,
      maxPages,
    };

    
    data.exclude.push(`${baseUrl}/**/*.mp3`);

    const client = this.celeryClient.get(CeleryClientQueue.CRAWLER);
    const task = client.createTask('tasks.crawl');
    await task.applyAsync([data, kbId.toString(), 1, useAlternateParser]);

    await this.kbDbService.updateKnowledgebaseStatus(
      kbId,
      KnowledgebaseStatus.CRAWLING,
    );
  }

  

  public cleanWebsiteData(
    data: Knowledgebase['websiteData'],
  ): Knowledgebase['websiteData'] {
    function validateUrl(url: string): string {
      if (!(url.startsWith('http://') || url.startsWith('https://'))) {
        throw new HttpException(`Invalid Url ${url}`, HttpStatus.BAD_REQUEST);
      }

      
      url = url.replace(/\/+$/, '');

      return url;
    }

    function validatePath(path: string): string {
      
      if (path[0] !== '/') {
        path = '/' + path;
      }

      
      path = path.replace(/\/+$/, '');

      return path;
    }

    
    data.websiteUrl = validateUrl(data.websiteUrl);
    data.urls = data.urls.map(validateUrl);

    data.include = data.include.map(validatePath);
    data.exclude = data.exclude.map(validatePath);

    return data;
  }

  

  async createKnowledgebase(user: UserSparse, data: CreateKnowledgebaseDTO) {
    
    const kbCount = await this.kbDbService.getKnowledgebaseCountForUser(
      user._id,
    );
    const subscriptionData = this.getUserSubscriptionData(user);
    if (kbCount >= subscriptionData.maxChatbots) {
      throw new HttpException(
        'Max Knowledgebase count reached for user',
        HttpStatus.BAD_REQUEST,
      );
    }

    const websiteData: Knowledgebase['websiteData'] = data.websiteUrl
      ? this.cleanWebsiteData({
          websiteUrl: data.websiteUrl,
          urls: data.urls,
          include: data.include,
          exclude: data.exclude,
        })
      : undefined;
    const participantsData: ParticipantsData = {
      id: user._id,
      role: UserRoles.ADMIN,
      email: user.email,
    };
    
    const ts = new Date();
    const kb: Knowledgebase = {
      name: data.name,
      owner: user._id,
      participants: [participantsData],
      status: KnowledgebaseStatus.CREATED,
      websiteData,
      createdAt: ts,
      updatedAt: ts,
      embeddingModel: EmbeddingModel.OPENAI_EMBEDDING_3,
      model: 'gpt-3.5-turbo',
    };
    const kbData = await this.kbDbService.insertKnowledgebase(kb);

    
    if (websiteData) {
      const maxPages = isAdmin(user) ? 2000 : subscriptionData.maxPages;
      await this.crawlWebsiteForKb(
        kbData._id,
        websiteData,
        maxPages,
        data.useAlternateParser,
      );
    }

    return kbData;
  }

  

  async updateKnowledgebaseWebsiteData(
    user: UserSparse,
    id: string,
    data: UpdateKnowledgebaseWebsiteDataDTO,
  ) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    if (
      kb.status === KnowledgebaseStatus.CRAWLING ||
      kb.status === KnowledgebaseStatus.GENERATING_EMBEDDINGS
    ) {
      throw new HttpException(
        'Knowledgebase already in training',
        HttpStatus.BAD_REQUEST,
      );
    }

    const subscriptionData = this.getUserSubscriptionData(user);

    const websiteData: Knowledgebase['websiteData'] = this.cleanWebsiteData({
      websiteUrl: data.websiteUrl,
      urls: data.urls,
      include: data.include,
      exclude: data.exclude,
    });

    
    await Promise.all([
      this.kbDbService.deleteKbDataStoreItemsForKnowledgebase(
        kbId,
        DataStoreType.WEBPAGE,
      ),
      this.kbDbService.deleteChunksForKnowledgebase(
        kbId,
        DataStoreType.WEBPAGE,
      ),
      this.kbDbService.deleteKbEmbeddingsForKnowledgebase(
        kbId,
        DataStoreType.WEBPAGE,
      ),
    ]);

    const updateData: Partial<Knowledgebase> = {
      status: KnowledgebaseStatus.CREATED,
      websiteData,
    };

    
    await this.kbDbService.updateKnowledgebase(kbId, updateData);

    const updatedData = { ...kb, ...updateData };

    
    const maxPages = isAdmin(user) ? 2000 : subscriptionData.maxPages;
    await this.crawlWebsiteForKb(
      kbId,
      websiteData,
      maxPages,
      data.useAlternateParser,
    );

    return updatedData;
  }

  

  async generateEmbeddingsForKnowledgebase(user: UserSparse, id: string) {
    const kbId = new ObjectId(id);

    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    if (
      kb.status === KnowledgebaseStatus.CRAWLING ||
      kb.status === KnowledgebaseStatus.GENERATING_EMBEDDINGS
    ) {
      throw new HttpException(
        'Knowledgebase already in training',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.kbDbService.updateKnowledgebaseStatus(
      kbId,
      KnowledgebaseStatus.GENERATING_EMBEDDINGS,
    );

    const client = this.celeryClient.get(CeleryClientQueue.CRAWLER);
    const task = client.createTask('tasks.gen_embeddings');
    await task.applyAsync([kbId.toString()]);
  }

  

  private getUserSubscriptionData(user: UserSparse): SubscriptionPlanInfo {
    const userPlan = user.activeSubscription;
    return this.subPlanInfoService.getSubscriptionPlanInfo(userPlan);
  }

  private getBaseSystemMsgFromPrompt(prompt: string): string {
    try {
      const promptJson = JSON.parse(prompt);
      const systemMsg = promptJson[0].content;
      const baseMsg = systemMsg.split('\n\nContext Sections')[0];
      return baseMsg;
    } catch {
      return undefined;
    }
  }

  private constructPromptFromBaseSystemMsg(msg: string): string {
    const prompt = JSON.parse(DEFAULT_CHATGPT_PROMPT);
    const baseMsg: string[] = prompt[0].content.split('\n\nContext Sections');
    baseMsg[0] = msg;
    prompt[0].content = baseMsg.join('\n\nContext Sections');
    return JSON.stringify(prompt);
  }

  

  async listKnowledgebasesForUser(user: UserSparse) {
    
    
    const kbs = await this.kbDbService.getKnowledgesbaseListForUser(user._id);

    const participatedList =
      await this.kbDbService.getParticipatedKnowledgesbaseListForUser(user._id);

    
    
    participatedList.forEach((kb) => {
      if (!kbs.some((entry) => entry._id.equals(kb._id))) {
        kbs.push(kb);
      }
    });
    return kbs;
  }

  

  async getKnowledgeBaseDetail(user: UserSparse, id: string) {
    const kb = await this.kbDbService.getKnowledgebaseById(new ObjectId(id));
    checkUserPermissionForKb(user, kb, [UserPermissions.READ]);

    
    if (!kb.prompt) {
      kb.prompt = DEFAULT_CHATGPT_PROMPT;
    }

    kb.prompt = this.getBaseSystemMsgFromPrompt(kb.prompt);

    return kb;
  }

  

  async setKnowledgebaseAsDemo(user: UserSparse, knowledgebaseId: string) {
    const kbId = new ObjectId(knowledgebaseId);

    
    const res = await this.kbDbService.updateKnowledgebase(kbId, {
      isDemo: true,
    });

    if (res.modifiedCount === 0) {
      throw new HttpException('Invalid Knowledgebase', HttpStatus.NOT_FOUND);
    }
  }

  

  async deleteKnowledgebaseForUser(user: UserSparse, id: string) {
    const kbId = new ObjectId(id);

    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.DELETE]);

    await Promise.all([
      this.kbDbService.deleteKnowledgebase(kbId),
      this.kbDbService.deleteKbDataStoreItemsForKnowledgebase(kbId),
      this.kbDbService.deleteChunksForKnowledgebase(kbId),
      this.kbDbService.deleteKbEmbeddingsForKnowledgebase(kbId),
    ]);
  }

  

  async setKnowledgebaseChatWidgeData(user: UserSparse, id: string, data: any) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    await this.kbDbService.setKnowledgebaseChatWidgetData(kbId, data);
  }

  

  async getKnowledgebaseChatWidgetData(id: string) {
    let kbId: ObjectId;
    try {
      kbId = new ObjectId(id);
    } catch {
      throw new HttpException('Invalid Knowledgebase Id', HttpStatus.NOT_FOUND);
    }

    const kbData = await this.kbDbService.getKnowledgebaseById(kbId);
    if (!kbData) {
      throw new HttpException('Invalid Knowledgebase Id', HttpStatus.NOT_FOUND);
    }

    const userData = await this.userService.findUserById(
      kbData.owner.toHexString(),
    );

    const whitelabelling = {
      removeBranding: userData.whitelabelling?.removeBranding || false,
    };

    if (
      userData.activeSubscription === Subscription.APPSUMO_TIER3 &&
      userData.customKeys?.useOwnKey === true
    ) {
      whitelabelling.removeBranding = true;
    }

    const widgetData = {
      id,
      chatWidgeData: kbData.chatWidgeData,
      customKey: userData.customKeys?.useOwnKey,
      whitelabelling,
    };

    return widgetData;
  }

  async getChatWidgetDataForDomain(domain: string) {
    
    const kb = await this.kbDbService.getKnowledgebaseSparseByDomain(domain);
    if (!kb) {
      throw new HttpException('Invalid Domain', HttpStatus.NOT_FOUND);
    }

    return this.getKnowledgebaseChatWidgetData(kb._id.toHexString());
  }

  

  async setKnowledgebaseDefaultAnswer(
    user: UserSparse,
    id: string,
    defaultAnswer?: string,
  ) {
    const kbId = new ObjectId(id);

    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    await this.kbDbService.updateKnowledgebase(kbId, {
      defaultAnswer,
    });
  }

  async setKnowledgebasePrompt(user: UserSparse, id: string, prompt: string) {
    const kbId = new ObjectId(id);

    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    prompt = this.constructPromptFromBaseSystemMsg(prompt);

    await this.kbDbService.updateKnowledgebase(kbId, {
      prompt,
    });

    return 'Done';
  }

  async setUserCustomKeys(
    user: UserSparse,
    id: string,
    keyData: CustomKeyData,
  ) {
    const encryptedKeys = this.customKeyService.encryptCustomKeys(keyData.keys);

    await this.userService.setUserCustomKeys(user._id, {
      useOwnKey: keyData.useOwnKey,
      keys: encryptedKeys,
    });
  }

  async setKnowledgebaseAdminEmail(
    user: UserSparse,
    id: string,
    email: string,
  ) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    await this.kbDbService.updateKnowledgebase(kbId, { adminEmail: email });
  }

  

  async setCustomDomain(user: UserSparse, id: string, domain: string) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb);

    await this.kbDbService.updateKnowledgebase(kbId, {
      customDomain: domain,
    });

    return 'Done';
  }

  

  async setModelName(user: UserSparse, id: string, model: string) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    const subscriptionData: SubscriptionPlanInfo =
      this.getUserSubscriptionData(user);

    if (subscriptionData.name === 'FREE') {
      throw new HttpException(
        'You need to upgrade to a paid plan for using this feature',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.kbDbService.updateKnowledgebase(kbId, {
      model,
    });

    return 'Done';
  }

  

  async setKnowledgebaseName(user: UserSparse, id: string, name: string) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.EDIT]);

    await this.kbDbService.updateKnowledgebase(kbId, { name: name });

    return 'Done';
  }

  private async updateKnowLedgeBaseParticipantsList(
    userId: ObjectId,
    kbId: ObjectId,
    role: string,
    email: string,
    kb,
  ) {
    let updatedParticipants;

    if (kb.participants && Array.isArray(kb.participants)) {
      updatedParticipants = kb.participants.map((owner) => {
        if (owner.id.toString() === userId.toString()) {
          
          return {
            id: userId,
            role: role,
            email: email,
          };
        }
        return owner;
      });

      
      if (
        !kb.participants.some(
          (owner) => owner.id.toString() === userId.toString(),
        )
      ) {
        
        updatedParticipants.push({ id: userId, role: role, email: email });
      }
    } else {
      updatedParticipants = [{ id: userId, role: role, email: email }];
    }

    if (updatedParticipants) {
      await this.kbDbService.updateKnowledgebaseParticipants(
        kbId,
        updatedParticipants,
      );
    }
  }

  async inviteUserToKnowledgeBase(
    user: UserSparse,
    id: string,
    data: InviteUserDTO,
  ) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.INVITE_USER]);

    if (!data.email || !data.role) {
      throw new HttpException('Not email/role found!', HttpStatus.NOT_FOUND);
    }

    if (!Object.values(UserRoles).includes(data.role as UserRoles)) {
      throw new HttpException('Invalid role!', HttpStatus.NOT_FOUND);
    }

    const invitedUser = await this.userService.getUserByEmail(data.email);

    let userExist = false;
    if (invitedUser) {
      
      const userId = invitedUser._id;
      await this.updateKnowLedgeBaseParticipantsList(
        userId,
        kbId,
        data.role,
        data.email,
        kb,
      );
      userExist = true;
    } else {
      
      await this.userService.insertOrUpdateInvitedEmail(
        data.email,
        kbId,
        data.role,
      );
    }

    
    await this.emailService.sendInviteUserEmail(
      data.email,
      user.email,
      kb.name,
      userExist,
    );

    return 'Done';
  }

  async addInvitedUsersToKnowledgeBase(email: string, userId: ObjectId) {
    const invitedList = await this.userService.getInvitedEmail(email);

    if (invitedList.length !== 0) {
      for (const invitedData of invitedList) {
        const kb = await this.kbDbService.getKnowledgebaseSparseById(
          invitedData.knowledgebaseId,
        );
        if (kb) {
          await this.updateKnowLedgeBaseParticipantsList(
            userId,
            kb._id,
            invitedData.role,
            email,
            kb,
          );
          await this.userService.deleteFromInvitedEmail(email, kb._id);
        }
      }
    }
    return 'Done';
  }

  async deleteUserFromKnowledgeBase(
    user: UserSparse,
    id: string,
    userId: string,
  ) {
    const kbId = new ObjectId(id);
    const kb = await this.kbDbService.getKnowledgebaseSparseById(kbId);
    checkUserPermissionForKb(user, kb, [UserPermissions.DELETE_USER]);

    if (userId === kb.owner.toString()) {
      throw new HttpException(
        "Sorry, you can't delete the owner of this knowledgebase!",
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedParticipants = kb.participants.filter(
      (participant) => participant.id.toString() !== userId,
    );

    await this.kbDbService.updateKnowledgebaseParticipants(
      kbId,
      updatedParticipants,
    );

    return;
  }
}
