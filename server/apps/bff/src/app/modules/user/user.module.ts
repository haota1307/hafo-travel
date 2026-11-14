import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';

import { UserController } from './controllers/user.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.USER_ACCESS_SERVICE),
    ]),
  ],
  controllers: [UserController],
  providers: [],
})
export class UserModule {}
