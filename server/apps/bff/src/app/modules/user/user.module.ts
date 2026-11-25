import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { AuthorizationCacheModule } from '@common/configuration/authorization-cache.config';
import { AuthorizationService } from '@common/guards/authorization.service';
import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';

import { UserController } from './controllers/user.controller';

@Module({
  imports: [
    AuthorizationCacheModule,
    ClientsModule.registerAsync([GrpcProvider(GRPC_SERVICES.IDENTITY_SERVICE)]),
  ],
  controllers: [UserController],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class UserModule {}
