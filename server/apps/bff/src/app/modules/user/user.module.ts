import { Module } from '@nestjs/common';

import { UserController } from './controllers/user.controller';
import { ClientsModule } from '@nestjs/microservices';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      TcpProvider(TCP_SERVICES.USER_ACCESS_SERVICE),
    ]),
  ],
  controllers: [UserController],
  providers: [],
})
export class UserModule {}
