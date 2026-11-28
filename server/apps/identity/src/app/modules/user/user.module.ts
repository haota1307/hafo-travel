import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthorizationCacheModule } from '@common/configuration/authorization-cache.config';
import { RoleDestination } from '@common/schemas/role.schema';
import { UserDestination } from '@common/schemas/user.schema';

import { RoleModule } from '@identity/role/role.module';
import { InternalUserController } from '@identity/user/controllers/internal-user.controller';
import { UserController } from '@identity/user/controllers/user.controller';
import { InternalUserRepository } from '@identity/user/repositories/internal-user.repository';
import { UserRepository } from '@identity/user/repositories/user.repository';
import { InternalUserService } from '@identity/user/services/internal-user.service';
import { UserService } from '@identity/user/services/user.service';

@Module({
  imports: [
    AuthorizationCacheModule,
    MongooseModule.forFeature([UserDestination, RoleDestination]),
    RoleModule,
  ],
  controllers: [UserController, InternalUserController],
  providers: [
    UserRepository,
    UserService,
    InternalUserRepository,
    InternalUserService,
  ],
  exports: [UserService, InternalUserService],
})
export class UserModule {}
