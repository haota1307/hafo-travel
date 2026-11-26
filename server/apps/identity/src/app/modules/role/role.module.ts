import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthorizationCacheModule } from '@common/configuration/authorization-cache.config';
import { RoleDestination } from '@common/schemas/role.schema';
import { UserDestination } from '@common/schemas/user.schema';

import { RoleController } from '@identity/role/controllers/role.controller';
import { RoleRepository } from '@identity/role/repositories/role.repository';
import { RoleService } from '@identity/role/services/role.service';

@Module({
  imports: [
    AuthorizationCacheModule,
    MongooseModule.forFeature([RoleDestination, UserDestination]),
  ],
  controllers: [RoleController],
  providers: [RoleRepository, RoleService],
  exports: [RoleService],
})
export class RoleModule {}
