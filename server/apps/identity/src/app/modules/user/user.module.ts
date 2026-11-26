import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthorizationCacheModule } from '@common/configuration/authorization-cache.config';
import { RoleDestination } from '@common/schemas/role.schema';
import { UserDestination } from '@common/schemas/user.schema';

import { RoleModule } from '@identity/role/role.module';
import { UserController } from '@identity/user/controllers/user.controller';
import { UserRepository } from '@identity/user/repositories/user.repository';
import { UserService } from '@identity/user/services/user.service';

@Module({
  imports: [
    AuthorizationCacheModule,
    MongooseModule.forFeature([UserDestination, RoleDestination]),
    RoleModule,
  ],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
