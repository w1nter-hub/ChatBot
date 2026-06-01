import {
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../common/config/appConfig.service';
import { CreateUserDTO } from '../user/user.dto';
import { UserSparse } from '../user/user.schema';
import { UserService } from '../user/user.service';
import { GoogleAuthDTO } from './auth.dto';
import { getGoogleUserProfile } from './google-auth';
import { JwtPayload, JwtToken } from './types/jwt-types.dto';
import { EmailService } from '../common/email/email.service';
import { KnowledgebaseService } from '../knowledgebase/knowledgebase.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger;

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private appConfig: AppConfigService,
    private emailService: EmailService,
    private knowledgebaseService: KnowledgebaseService,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  

  private signPayload(payload: JwtPayload) {
    return {
      access: this.jwtService.sign(payload),
    };
  }

  

  async validateJwtPayload(payload: JwtPayload) {
    const { sub } = payload;
    return this.userService.findUserByIdSparse(sub);
  }

  

  async getJwtTokenForUser(user: UserSparse): Promise<JwtToken> {
    await this.userService.updateLastLoginTs(user);

    await this.userService.findUserByIdSparse(user._id.toString());

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    return this.signPayload(payload);
  }

  async getJwtTokenForUserAdmin(id: string): Promise<JwtToken> {
    const user = await this.userService.findUserByIdSparse(id);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    return this.signPayload(payload);
  }

  

  async validateEmailPassword(email: string, password: string) {
    return this.userService.findByEmailPassword(email, password);
  }

  

  async signup(data: CreateUserDTO) {
    const user = await this.userService.createUser(data);
    
    
    await this.knowledgebaseService.addInvitedUsersToKnowledgeBase(
      data.email,
      user._id,
    );
    try {
      await this.emailService.sendWelcomeEmail(user.email);
    } catch (error) {
      this.logger.error('Error sending welcome email', error);
    }
    const token = await this.getJwtTokenForUser(user);
    return {
      ...user,
      ...token,
    };
  }

  async googleAuth(data: GoogleAuthDTO) {
    let userProfile;
    try {
      userProfile = await getGoogleUserProfile(
        data.token,
        this.appConfig.get('googleClientId'),
      );
      if (!userProfile.email) {
        throw new HttpException(
          'Invalid Google User profile info',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch {
      throw new HttpException(
        'Invalid Google Access Token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    
    const user = await this.userService.getUserByEmail(userProfile.email);

    
    if (user) {
      await this.userService.updateLastLoginTs(user);
      
      
      await this.knowledgebaseService.addInvitedUsersToKnowledgeBase(
        userProfile.email,
        user._id,
      );
      return this.getJwtTokenForUser(user);
    }

    
    const newUser = await this.userService.createGoogleOAuthUser(userProfile);
    
    
    await this.knowledgebaseService.addInvitedUsersToKnowledgeBase(
      userProfile.email,
      newUser._id,
    );
    try {
      await this.emailService.sendWelcomeEmail(newUser.email);
    } catch (error) {
      this.logger.error('Error sending welcome email', error);
    }
    return this.getJwtTokenForUser(newUser);
  }

  

  validateApiKey(apiKey: string): Promise<UserSparse> {
    return this.userService.findUserByApiKey(apiKey);
  }
}
