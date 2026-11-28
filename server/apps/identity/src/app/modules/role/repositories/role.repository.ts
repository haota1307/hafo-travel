import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Types } from 'mongoose';

import {
  Role,
  type RoleDisplayNames,
  type RoleModel,
  RoleModelName,
} from '@common/schemas/role.schema';
import { type UserModel, UserModelName } from '@common/schemas/user.schema';

type RoleInput = Pick<Role, 'name' | 'description' | 'permissions'> &
  RoleDisplayNames;

@Injectable()
export class RoleRepository {
  constructor(
    @InjectModel(RoleModelName) private readonly roleModel: RoleModel,
    @InjectModel(UserModelName) private readonly userModel: UserModel,
  ) {}

  getAll() {
    return this.roleModel.find().exec();
  }

  getById(id: string) {
    return this.roleModel.findById(id).exec();
  }

  getByName(name: string) {
    return this.roleModel.findOne({ name }).exec();
  }

  create(data: RoleInput) {
    return this.roleModel.create(data);
  }

  update(id: string, data: RoleInput) {
    return this.roleModel
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .exec();
  }

  delete(id: string) {
    return this.roleModel.findByIdAndDelete(id).exec();
  }

  async isAssigned(id: string): Promise<boolean> {
    const user = await this.userModel.exists({ roles: id }).exec();

    return Boolean(user);
  }

  getMemberCounts(roleIds: Types.ObjectId[]) {
    const filter = { roles: { $in: roleIds } };

    return this.userModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: filter },
        { $unwind: '$roles' },
        { $match: filter },
        { $group: { _id: { role: '$roles', user: '$_id' } } },
        { $group: { _id: '$_id.role', count: { $sum: 1 } } },
      ])
      .exec();
  }
}
