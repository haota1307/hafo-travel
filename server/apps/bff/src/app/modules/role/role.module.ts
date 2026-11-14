import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';

import { RoleController } from './controllers/role.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.USER_ACCESS_SERVICE),
    ]),
  ],
  controllers: [RoleController],
})
export class RoleModule {}
