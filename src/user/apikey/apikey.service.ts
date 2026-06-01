import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { ApikeyData, UserSparse } from '../user.schema';
import { UserService } from '../user.service';

@Injectable()
export class ApikeyService {
  constructor(private readonly userService: UserService) {}

  

  async getAllApiKeys(user: UserSparse): Promise<ApikeyData[]> {
    const apiKeysData = await this.userService.getUserApikeys(user._id);
    if (!apiKeysData) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (!apiKeysData.apiKeys || apiKeysData.apiKeys.length === 0) {
      return [];
    }
    return apiKeysData.apiKeys;
  }

  

  async deleteApiKey(userId: ObjectId, id: string) {
    let apiKeyId: ObjectId;
    try {
      apiKeyId = new ObjectId(id);
    } catch (e) {
      throw new HttpException('Invalid API-Key id', HttpStatus.BAD_REQUEST);
    }
    return await this.userService.deleteApiKey(userId, apiKeyId);
  }

  

  async createApiKey(user: UserSparse, keyName: string): Promise<string> {
    const apikey = uuidv4();

    const apikeyData: ApikeyData = {
      id: new ObjectId(),
      apiKey: apikey,
      name: keyName,
      createdAt: new Date(),
    };
    return await this.userService.addNewApikey(user._id, apikeyData);
  }
}
