import { randomUUID } from 'node:crypto';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  Role,
  RoleModelName,
  type RoleModel,
} from '@common/schemas/role.schema';
import {
  UserModelName,
  type UserModel,
  type User,
} from '@common/schemas/user.schema';

@Injectable()
export class AccountRepository {
  constructor(
    @InjectModel(UserModelName) private readonly users: UserModel,
    @InjectModel(RoleModelName) private readonly roles: RoleModel,
  ) {}

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
        },
        { $set: { googleSubject } },
        { new: true, collation: { locale: 'simple' } },
      )
      .populate<{ roles: Role[] }>('roles')
      .exec();
  }

  async createClient(
    data: Pick<User, 'email' | 'firstName' | 'lastName'> &
      Pick<Partial<User>, 'googleSubject' | 'passwordHash'>,
  ) {
    const role = await this.roles
      .findOne({ name: 'client' })
      .select('_id')
      .exec();

    if (!role) {
      throw new ServiceUnavailableException('Client role is not configured');
    }

    const user = await this.users.create({
      ...data,
      userId: randomUUID(),
      roles: [role._id],
      emailVerifiedAt: new Date(),
    });

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
        },
        { $set: { passwordHash, credentialVersion: randomUUID() } },
      )
      .exec();

    return result.modifiedCount === 1;
  }
}
