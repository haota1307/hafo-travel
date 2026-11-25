import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { Role } from '@common/schemas/role.schema';
import {
  User,
  type UserModel,
  UserModelName,
} from '@common/schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserModelName) private readonly userModel: UserModel,
  ) {}

  create(data: Partial<User>): Promise<User> {
    return this.userModel.create(data);
  }

  getById(id: string) {
    return this.userModel.findById(id).exec();
  }

  getByUserId(userId: string) {
    return this.userModel
      .findOne({ userId })
      .populate<{ roles: Role[] }>('roles')
      .exec();
  }

  getByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  setRoles(userId: string, roles: Types.ObjectId[]) {
    return this.userModel
      .findOneAndUpdate(
        { userId },
        { $set: { roles } },
        { new: true, runValidators: true },
      )
      .populate<{ roles: Role[] }>('roles')
      .exec();
  }

  async exists(email: string): Promise<boolean> {
    const result = await this.userModel.exists({ email }).exec();

    return !!result;
  }
}
