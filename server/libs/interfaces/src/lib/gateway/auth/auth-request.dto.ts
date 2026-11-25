import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
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

export class RefreshSessionRequestDto {
  @ApiProperty({ writeOnly: true, maxLength: REFRESH_TOKEN_MAX_LENGTH })
  @IsString()
  @MaxLength(REFRESH_TOKEN_MAX_LENGTH)
  @Matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  refreshToken: string;
}
