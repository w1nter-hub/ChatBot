import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { AppRunner } from '@seratch_/bolt-http-runner';
import { App, LogLevel } from '@slack/bolt';
import { NextFunction } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { ObjectId } from 'mongodb';
import { KnowledgebaseDbService } from '../knowledgebase/knowledgebase-db.service';
import { SlackTokenService } from './slack-token.service';
import { SlackBotService } from './slackbot.service';

@Injectable()
export class SlackBoltMiddleware implements NestMiddleware {
  private readonly logger: Logger;
  private appRunner: AppRunner;

  public constructor(
    private readonly slackBotService: SlackBotService,
    private readonly slackTokenService: SlackTokenService,
    private readonly kbDbService: KnowledgebaseDbService,
  ) {
    this.logger = new Logger(SlackBoltMiddleware.name);
    const runner = new AppRunner({
      
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      scopes: ['chat:write', 'app_mentions:read', 'im:history', 'im:read'],
      installationStore: {
        storeInstallation: async (installation) => {
          if (
            installation.isEnterpriseInstall &&
            installation.enterprise !== undefined
          ) {
            
            return await this.slackTokenService.saveInstallationToDatabase(
              installation.enterprise.id,
              installation,
            );
          }
          if (installation.team !== undefined) {
            
            return await this.slackTokenService.saveInstallationToDatabase(
              installation.team.id,
              installation,
            );
          }
          this.logger.error('Failed to save installation in db');
          throw new Error(
            'Failed saving installation data to installationStore',
          );
        },
        fetchInstallation: async (installQuery) => {
          if (
            installQuery.isEnterpriseInstall &&
            installQuery.enterpriseId !== undefined
          ) {
            
            return await slackTokenService.fetchInstallationByTeamId(
              installQuery.enterpriseId,
            );
          }
          if (installQuery.teamId !== undefined) {
            
            return await slackTokenService.fetchInstallationByTeamId(
              installQuery.teamId,
            );
          }
          this.logger.error('Failed to fetch installation from db');
          throw new Error('Failed fetching installation');
        },
        deleteInstallation: async (installQuery) => {
          if (
            installQuery.isEnterpriseInstall &&
            installQuery.enterpriseId !== undefined
          ) {
            
            return await slackTokenService.deleteInstallationByTeamId(
              installQuery.enterpriseId,
            );
          }
          if (installQuery.teamId !== undefined) {
            
            return await slackTokenService.deleteInstallationByTeamId(
              installQuery.teamId,
            );
          }
          this.logger.error('Failed to delete installation from db');
          throw new Error('Failed to delete installation');
        },
      },
      installerOptions: {
        stateVerification: false,
        installPathOptions: {
          beforeRedirection: async (req, res) => {
            
            const qoldauBotId = req.url.split('qoldauKbId=')[1];
            this.logger.log(`qoldauKbId: ${qoldauBotId}`);
            if (
              qoldauBotId &&
              (await this.isValidKnowledgebase(qoldauBotId))
            ) {
              
              const d = new Date();
              d.setTime(d.getTime() + 5 * 60 * 1000); 
              const expires = 'expires=' + d.toUTCString();
              res.setHeader(
                'Set-Cookie',
                `qoldauKbId=${qoldauBotId}; ${expires}; path=/;`,
              );
              return true;
            } else {
              return false;
            }
          },
        },
        callbackOptions: {
          beforeInstallation: async (options, req, res) => {
            
            const cookie = req.headers.cookie;
            
            
            res.setHeader(
              'Set-Cookie',
              'qoldauKbId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;',
            );
            const regex = /qoldauKbId=([a-zA-Z0-9]+)/; 
            const match = cookie.match(regex);
            let qoldauBotId;
            if (match) {
              qoldauBotId = match[1];
            }
            if (qoldauBotId) {
              options.metadata = qoldauBotId;
              return true;
            }
            return false;
          },
        },
      },
    });

    const app = new App(runner.appOptions());

    app.event('message', this.onAppMention.bind(this));

    app.event('app_mention', this.onAppMention.bind(this));

    app.event('app_uninstalled', async ({ event, logger, context }) => {
      try {
        if (context.isEnterpriseInstall && context.enterpriseId !== undefined) {
          
          return await slackTokenService.deleteInstallationByTeamId(
            context.enterpriseId,
          );
        }
        if (context.teamId !== undefined) {
          
          return await slackTokenService.deleteInstallationByTeamId(
            context.teamId,
          );
        }
      } catch (error) {
        logger.error(
          'Error while deleting slack installation data' + error.message,
        );
      }
    });

    runner.setup(app);
    this.appRunner = runner;
  }
  async isValidKnowledgebase(kbIdStr: string) {
    let kbId;
    try {
      kbId = new ObjectId(kbIdStr);
    } catch (e) {
      this.logger.error('Invalid knowledgebase id: ' + kbIdStr);
      return false;
    }
    const kbData = await this.kbDbService.getKnowledgebaseById(kbId);
    return !!kbData;
  }

  private async onAppMention({ event, say, client }) {
    
    if (event.channel_type === 'im' && event.subtype === 'message_changed') {
      return;
    }
    this.slackBotService.botProcessAppMention(event, say, client);
  }

  async use(req: IncomingMessage, res: ServerResponse, next: NextFunction) {
    const { pathname: path } = new URL(req.url as string, 'http://localhost');
    if (req.method === 'POST' && path === '/slack/events') {
      await this.appRunner.handleEvents(req, res);
    } else if (req.method === 'GET' && path === '/slack/install') {
      await this.appRunner.handleInstallPath(req, res);
    } else if (req.method === 'GET' && path === '/slack/oauth_redirect') {
      await this.appRunner.handleCallback(req, res);
    } else {
      next();
    }
  }
}
