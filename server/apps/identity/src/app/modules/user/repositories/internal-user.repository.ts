import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Types } from 'mongoose';

import { DASHBOARD_PERMISSIONS } from '@common/constants/enum/role.enum';
import { type RoleModel, RoleModelName } from '@common/schemas/role.schema';
import {
  type User,
  type UserModel,
  UserModelName,
} from '@common/schemas/user.schema';

export type InternalUserRecord = Pick<
  User,
  'firstName' | 'lastName' | 'email' | 'createdAt' | 'updatedAt'
> & {
  userId: string;
  role: { _id: Types.ObjectId; name: string };
  status: 'pending' | 'active' | 'locked';
  initialAdministrator: boolean;
};

const pendingAccess = {
  lockedAt: null,
  passwordHash: null,
  googleSubject: null,
};

@Injectable()
export class InternalUserRepository {
  constructor(
    @InjectModel(UserModelName) private readonly users: UserModel,
    @InjectModel(RoleModelName) private readonly roles: RoleModel,
  ) {}

  list() {
    return this.find();
  }

  async get(userId: string) {
    const [user] = await this.find(userId);

    return user;
  }

  async updateName(
    userId: string,
    roleId: Types.ObjectId,
    name: Pick<User, 'firstName' | 'lastName'>,
  ) {
    return this.users
      .updateOne({ userId, roles: [roleId] }, { $set: name })
      .exec();
  }

  async setRole(userId: string, roleId: Types.ObjectId, next: Types.ObjectId) {
    return this.users
      .updateOne(
        { userId, roles: [roleId], initialAdministrator: { $ne: true } },
        { $set: { roles: [next] } },
        { runValidators: true },
      )
      .exec();
  }

  async setLocked(
    userId: string,
    roleId: Types.ObjectId,
    locked: boolean,
    version: string,
  ) {
    const user = {
      userId,
      roles: [roleId],
      initialAdministrator: { $ne: true },
    };

    if (locked) {
      return this.users
        .updateOne(
          { ...user, lockedAt: null },
          {
            $set: {
              lockedAt: new Date(),
              credentialVersion: version,
              accessVersion: version,
            },
            $unset: { invitationVersion: 1 },
          },
        )
        .exec();
    }

    return this.users
      .updateOne(
        { ...user, lockedAt: { $type: 'date' } },
        { $unset: { lockedAt: 1 } },
      )
      .exec();
  }

  async prepareInvitation(
    userId: string,
    roleId: Types.ObjectId,
    version: string,
  ) {
    const pending = { userId, roles: [roleId], ...pendingAccess };

    await this.users
      .updateOne(
        { ...pending, invitationVersion: null },
        { $set: { invitationVersion: version } },
      )
      .exec();

    return this.users
      .findOne(pending)
      .select('email +invitationVersion')
      .exec();
  }

  async acceptInvitation(input: {
    userId: string;
    roleId: Types.ObjectId;
    invitationVersion: string;
    passwordHash: string;
  }) {
    const { userId, roleId, invitationVersion, passwordHash } = input;
    const result = await this.users
      .updateOne(
        { userId, roles: [roleId], invitationVersion, ...pendingAccess },
        {
          $set: { passwordHash, emailVerifiedAt: new Date() },
          $unset: { invitationVersion: 1 },
        },
      )
      .exec();

    return result.modifiedCount === 1;
  }

  private find(userId?: string) {
    return this.users
      .aggregate<InternalUserRecord>([
        {
          $match: {
            userId: userId ?? { $type: 'string', $ne: '' },
            roles: { $size: 1 },
          },
        },
        {
          $lookup: {
            from: this.roles.collection.name,
            localField: 'roles',
            foreignField: '_id',
            pipeline: [
              { $match: { permissions: { $in: DASHBOARD_PERMISSIONS } } },
              { $project: { name: 1 } },
            ],
            as: 'role',
          },
        },
        { $unwind: '$role' },
        {
          $project: {
            _id: 0,
            userId: 1,
            firstName: { $ifNull: ['$firstName', ''] },
            lastName: { $ifNull: ['$lastName', ''] },
            email: 1,
            role: 1,
            createdAt: 1,
            updatedAt: 1,
            initialAdministrator: {
              $eq: [{ $ifNull: ['$initialAdministrator', false] }, true],
            },
            status: {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $type: '$lockedAt' }, 'date'] },
                    then: 'locked',
                  },
                  {
                    case: {
                      $or: [
                        { $ne: [{ $ifNull: ['$passwordHash', ''] }, ''] },
                        { $ne: [{ $ifNull: ['$googleSubject', ''] }, ''] },
                      ],
                    },
                    then: 'active',
                  },
                ],
                default: 'pending',
              },
            },
          },
        },
      ])
      .exec();
  }
}
