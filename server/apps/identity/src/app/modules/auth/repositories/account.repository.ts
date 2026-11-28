import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import type { Role } from '@common/schemas/role.schema';
import {
  UserModelName,
  type UserModel,
  type User,
} from '@common/schemas/user.schema';

export type NewAccount = Pick<
  User,
  'email' | 'firstName' | 'lastName' | 'googleSubject' | 'passwordHash'
> & {
  userId: string;
  roles: User['roles'];
  emailVerifiedAt: Date;
};

@Injectable()
export class AccountRepository {
  constructor(@InjectModel(UserModelName) private readonly users: UserModel) {}

  existingEmail(email: string) {
    return this.users
      .exists({ email })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  byGoogleSubject(googleSubject: string) {
    return this.users
      .findOne({ googleSubject })
      .populate<{ roles: Role[] }>('roles')
      .exec();
  }

  linkRegisteredAccount(email: string, googleSubject: string) {
    return this.users
      .findOneAndUpdate(
        {
          email,
          $or: [
            { emailVerifiedAt: { $type: 'date' } },
            ...(email.endsWith('@gmail.com')
              ? [{ initialAdministrator: true }]
              : []),
          ],
          passwordHash: { $type: 'string' },
          googleSubject: { $exists: false },
          lockedAt: null,
        },
        { $set: { googleSubject } },
        { new: true, collation: { locale: 'simple' } },
      )
      .populate<{ roles: Role[] }>('roles')
      .exec();
  }

  async create(data: NewAccount) {
    const user = await this.users.create(data);

    return user.populate<{ roles: Role[] }>('roles');
  }

  async replacePassword(
    profileId: string,
    version: string,
    passwordHash: string,
  ) {
    const result = await this.users
      .updateOne(
        {
          _id: profileId,
          passwordHash: { $exists: true },
          credentialVersion: version || { $exists: false },
          lockedAt: null,
        },
        { $set: { passwordHash, credentialVersion: randomUUID() } },
      )
      .exec();

    return result.modifiedCount === 1;
  }
}
