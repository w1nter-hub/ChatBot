import {
  Controller,
  Post,
  Req,
  Delete,
  Get,
  HttpCode,
  Param,
  Body,
} from '@nestjs/common';
import { RequestWithUser } from '../../common/@types/nest.types';
import { ApikeyData } from '../user.schema';
import { CreateApiKeyDTO } from './apikey.dto';
import { ApikeyService } from './apikey.service';

@Controller('user/apikey')
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) { }

  

  @Get()
  @HttpCode(200)
  async getAllApiKeys(@Req() req: RequestWithUser): Promise<ApikeyData[]> {
    const { user } = req;
    return this.apikeyService.getAllApiKeys(user);
  }

  

  @Post()
  @HttpCode(201)
  async createApiKey(
    @Req() req: RequestWithUser,
    @Body() data: CreateApiKeyDTO,
  ): Promise<string> {
    const { user } = req;
    return this.apikeyService.createApiKey(user, data.name);
  }

  

  @Delete('/:id')
  @HttpCode(204)
  deleteApiKey(@Req() req: RequestWithUser, @Param('id') id: string) {
    const { user } = req;
    return this.apikeyService.deleteApiKey(user._id, id);
  }
}
