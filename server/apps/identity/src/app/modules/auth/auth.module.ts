import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';

import { AccessTokenModule } from '@common/configuration/access-token.config';
import { GrpcProvider, GRPC_SERVICES } from '@common/configuration/grpc.config';
import { AuthSessionDestination } from '@common/schemas/auth-session.schema';
import { UserDestination } from '@common/schemas/user.schema';

import { AccountController } from '@identity/auth/controllers/account.controller';
import { AuthController } from '@identity/auth/controllers/auth.controller';
import { AccountRepository } from '@identity/auth/repositories/account.repository';
import { AuthSessionRepository } from '@identity/auth/repositories/auth.repository';
import { AccountEmailService } from '@identity/auth/services/account-email.service';
import { AccountService } from '@identity/auth/services/account.service';
import { AuthService } from '@identity/auth/services/auth.service';
import { RoleModule } from '@identity/role/role.module';
import { UserModule } from '@identity/user/user.module';

@Module({
  imports: [
    AccessTokenModule,
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.NOTIFICATION_SERVICE),
    ]),
    MongooseModule.forFeature([AuthSessionDestination, UserDestination]),
    RoleModule,
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
