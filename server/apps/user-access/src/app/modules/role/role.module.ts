import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RoleDestination } from '@common/schemas/role.schema';
import { UserDestination } from '@common/schemas/user.schema';

import { RoleController } from './controllers/role.controller';
import { RoleRepository } from './repositories/role.repository';
import { RoleService } from './services/role.service';

@Module({
  imports: [MongooseModule.forFeature([RoleDestination, UserDestination])],
  controllers: [RoleController],
  providers: [RoleRepository, RoleService],
  exports: [RoleService],
})
export class RoleModule {}
