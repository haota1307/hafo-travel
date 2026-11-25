import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AccessTokenModule } from '@common/configuration/access-token.config';
import { AuthSessionDestination } from '@common/schemas/auth-session.schema';

import { UserModule } from '../user/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthSessionRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    AccessTokenModule,
    MongooseModule.forFeature([AuthSessionDestination]),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionRepository],
})
export class AuthModule {}
