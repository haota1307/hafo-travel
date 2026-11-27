import type { Types } from 'mongoose';

import type { CreateUserRequest } from '@common/interfaces/grpc/identity/v1/identity';
import type { User } from '@common/schemas/user.schema';

export const createUserRequestMapper = (
  data: CreateUserRequest,
  userId: string,
  roles: [Types.ObjectId],
): Partial<User> => {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    userId,
    roles,
  };
};
