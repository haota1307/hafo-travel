import { Module } from '@nestjs/common';

import { UserController } from './controllers/user.controller';
import { ClientsModule } from '@nestjs/microservices';
import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';

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
