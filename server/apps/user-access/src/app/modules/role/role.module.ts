import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RoleDestination } from '@common/schemas/role.schema';
import { RoleRepository } from './repositories/role.repository';

@Module({
  imports: [MongooseModule.forFeature([RoleDestination])],
  controllers: [],
  providers: [RoleRepository, RoleRepository],
  exports: [],
})
export class RoleModule {}
