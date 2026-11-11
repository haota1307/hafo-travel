import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '@nestjs/microservices';

import { UserService } from './services/user.service';
import { UserDestination } from '@common/schemas/user.schema';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './controllers/user.controller';
import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.AUTHORIZER_SERVICE),
    ]),
    MongooseModule.forFeature([UserDestination]),
  ],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [],
})
export class UserModule {}
