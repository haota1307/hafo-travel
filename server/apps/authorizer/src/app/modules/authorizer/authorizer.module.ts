import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';

import { KeycloakModule } from '../keycloak/keycloak.module';
import { AuthorizerController } from './controllers/authorizer.controller';
import { AuthorizerService } from './services/authorizer.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.USER_ACCESS_SERVICE),
    ]),
    KeycloakModule,
  ],
  controllers: [AuthorizerController],
  providers: [AuthorizerService],
})
export class AuthorizerModule {}
