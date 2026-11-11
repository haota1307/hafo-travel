import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModel, UserModelName } from '@common/schemas/user.schema';
import { Role } from '@common/schemas/role.schema';

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

  async exists(email: string): Promise<boolean> {
    const result = await this.userModel.exists({ email }).exec();
    return !!result;
  }
}
