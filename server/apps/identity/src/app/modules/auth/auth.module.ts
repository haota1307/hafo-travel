import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';

import { AccessTokenModule } from '@common/configuration/access-token.config';
import { GrpcProvider, GRPC_SERVICES } from '@common/configuration/grpc.config';
import { AuthSessionDestination } from '@common/schemas/auth-session.schema';
import { RoleDestination } from '@common/schemas/role.schema';
import { UserDestination } from '@common/schemas/user.schema';

import { UserModule } from '../user/user.module';
import { AccountController } from './controllers/account.controller';
import { AuthController } from './controllers/auth.controller';
import { AccountRepository } from './repositories/account.repository';
import { AuthSessionRepository } from './repositories/auth.repository';
import { AccountEmailService } from './services/account-email.service';
import { AccountService } from './services/account.service';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    AccessTokenModule,
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.NOTIFICATION_SERVICE),
    ]),
    MongooseModule.forFeature([
      AuthSessionDestination,
      UserDestination,
      RoleDestination,
    ]),
    UserModule,
  ],
  controllers: [AuthController, AccountController],
  providers: [
    AuthService,
    AuthSessionRepository,
    AccountService,
    AccountEmailService,
    AccountRepository,
  ],
})
export class AuthModule {}
