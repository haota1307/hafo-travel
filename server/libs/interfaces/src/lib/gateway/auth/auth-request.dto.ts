import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  MinLength,
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

import { REFRESH_TOKEN_MAX_LENGTH } from '@common/constants/access-token.constants';

export class LoginRequestDto {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ format: 'password', writeOnly: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  password: string;
}

export class EmailActionRequestDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ required: false, enum: ['vi', 'en'] })
  @IsOptional()
  @IsIn(['vi', 'en'])
  locale?: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token: string;

  @ApiProperty({ format: 'password', writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(1024)
  password: string;
}

export class VerifyEmailRequestDto extends ResetPasswordRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;
}

export class GoogleLoginRequestDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  credential: string;

  @ApiProperty({ required: false, writeOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  emailToken?: string;

  @ApiProperty({ required: false, enum: ['vi', 'en'] })
  @IsOptional()
  @IsIn(['vi', 'en'])
  locale?: string;
}

export class RefreshSessionRequestDto {
  @ApiProperty({ writeOnly: true, maxLength: REFRESH_TOKEN_MAX_LENGTH })
  @IsString()
  @MaxLength(REFRESH_TOKEN_MAX_LENGTH)
  @Matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  refreshToken: string;
}
