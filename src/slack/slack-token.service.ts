import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';

@Injectable()
export class SlackTokenService {
  private readonly slackTokenCollection: Collection;

  constructor(@Inject('MONGODB') private db: Db) {
    this.slackTokenCollection = this.db.collection('slackTokens');
  }

  

  async saveInstallationToDatabase(teamId: string, installation: any) {
    await this.slackTokenCollection.updateOne(
      { teamId },
      {
        $set: { installation, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  }

  

  async fetchInstallationByTeamId(teamId: string) {
    const result = await this.slackTokenCollection.findOne({ teamId });
    return result?.installation;
  }

  

  async deleteInstallationByTeamId(teamId: string) {
    const result = await this.slackTokenCollection.deleteOne({ teamId });
    if (result.deletedCount === 0) {
      throw new Error(`No document found with teamId: ${teamId}`);
    }
  }

  

  async fetchQoldauaiKbIdFromDatabase(teamId: string) {
    const result = await this.slackTokenCollection.findOne({ teamId });
    return result && result.installation && result.installation.metadata
      ? result.installation.metadata
      : null;
  }
}
