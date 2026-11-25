import { Types } from 'mongoose';

import type { CreateUserRequest } from '@common/interfaces/grpc/identity/v1/identity';
import { User } from '@common/schemas/user.schema';

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
