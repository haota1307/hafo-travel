import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';
import { AuthorizerController } from './controllers/authorizer.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.AUTHORIZER_SERVICE),
    ]),
  ],
  controllers: [AuthorizerController],
  providers: [],
  exports: [],
})
export class AuthorizerModule {}
