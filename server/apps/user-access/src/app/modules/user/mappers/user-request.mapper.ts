import { Types } from 'mongoose';

import { User } from '@common/schemas/user.schema';
import type { CreateUserRequest } from '@common/interfaces/grpc/user-access/v1/user-access';

export const createUserRequestMapper = (
  data: CreateUserRequest,
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
