import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Types } from 'mongoose';

import {
  type AuthSession,
  type AuthSessionModel,
  AuthSessionModelName,
} from '@common/schemas/auth-session.schema';

const CONCURRENT_LOGOUT_WINDOW_MS = 30_000;

@Injectable()
export class AuthSessionRepository {
  constructor(
    @InjectModel(AuthSessionModelName)
    private readonly sessionModel: AuthSessionModel,
  ) {}

  create(
    session: Pick<
      AuthSession,
      'profileId' | 'refreshHash' | 'refreshExpiresAt'
    >,
  ) {
    return this.sessionModel.create(session);
  }

  getByRefreshHash(refreshHash: string, now: Date) {
    return this.sessionModel
      .findOne({ refreshHash, refreshExpiresAt: { $gt: now } })
      .select('profileId refreshExpiresAt')
      .exec();
  }

  async rotate(
    id: Types.ObjectId,
    refreshHash: string,
    nextRefreshHash: string,
    now: Date,
  ) {
    const previousRefreshValidUntil = new Date(
      now.getTime() + CONCURRENT_LOGOUT_WINDOW_MS,
    );
    const result = await this.sessionModel
      .updateOne(
        { _id: id, refreshHash, refreshExpiresAt: { $gt: now } },
        {
          $set: {
            refreshHash: nextRefreshHash,
            previousRefreshHash: refreshHash,
            previousRefreshValidUntil,
          },
        },
      )
      .exec();

    return result.modifiedCount === 1;
  }

  async deleteByRefreshHash(refreshHash: string, now: Date): Promise<void> {
    await this.sessionModel
      .deleteOne({
        refreshExpiresAt: { $gt: now },
        $or: [
          { refreshHash },
          {
            previousRefreshHash: refreshHash,
            previousRefreshValidUntil: { $gt: now },
          },
        ],
      })
      .exec();
  }
}
