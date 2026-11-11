import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { KeycloakModule } from '../keycloak/keycloak.module';
import { AuthorizerService } from './services/authorizer.service';
import { AuthorizerController } from './controllers/authorizer.controller';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      TcpProvider(TCP_SERVICES.USER_ACCESS_SERVICE),
    ]),
    KeycloakModule,
  ],
  controllers: [AuthorizerController],
  providers: [AuthorizerService],
})
export class AuthorizerModule {}
