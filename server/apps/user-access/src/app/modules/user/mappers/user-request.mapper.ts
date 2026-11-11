import { Types } from 'mongoose';

import { User } from '@common/schemas/user.schema';
import { CreateUserTcpRequest } from '@common/interfaces/tcp/user';

export const createUserRequestMapper = (
  data: CreateUserTcpRequest,
  userId: string,
): Partial<User> => {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    userId,
    roles: data.roles.map((role) => new Types.ObjectId(role)),
  };
};
