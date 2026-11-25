import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  Role,
  type RoleModel,
  RoleModelName,
} from '@common/schemas/role.schema';
import { type UserModel, UserModelName } from '@common/schemas/user.schema';

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

  getByIds(ids: string[]) {
    return this.roleModel.find({ _id: { $in: ids } }).exec();
  }

  create(data: Pick<Role, 'name' | 'description' | 'permissions'>) {
    return this.roleModel.create(data);
  }

  update(id: string, data: Pick<Role, 'name' | 'description' | 'permissions'>) {
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
}
