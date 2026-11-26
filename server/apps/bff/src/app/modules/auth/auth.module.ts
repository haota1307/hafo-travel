import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';

import { AuthController } from '@bff/auth/controllers/auth.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([GrpcProvider(GRPC_SERVICES.IDENTITY_SERVICE)]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
