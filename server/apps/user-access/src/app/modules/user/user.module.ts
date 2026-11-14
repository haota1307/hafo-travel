import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';

import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';
import { RoleDestination } from '@common/schemas/role.schema';
import { UserDestination } from '@common/schemas/user.schema';

import { RoleModule } from '../role/role.module';
import { UserController } from './controllers/user.controller';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.AUTHORIZER_SERVICE),
    ]),
    MongooseModule.forFeature([UserDestination, RoleDestination]),
    RoleModule,
  ],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [],
})
export class UserModule {}
