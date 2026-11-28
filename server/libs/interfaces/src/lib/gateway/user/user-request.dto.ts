import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: [String], minItems: 1, maxItems: 1 })
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsArray()
  roles: string[];
}

export class SetUserRolesRequestDto {
  @ApiProperty({ type: [String], minItems: 1, maxItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsMongoId({ each: true })
  roles: string[];
}

export class InternalUserNameRequestDto {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;
}

export class InternalUserInvitationLocaleRequestDto {
  @ApiProperty({ required: false, enum: ['vi', 'en'] })
  @IsOptional()
  @IsIn(['vi', 'en'])
  locale?: string;
}

export class InviteInternalUserRequestDto extends IntersectionType(
  InternalUserNameRequestDto,
  SetUserRolesRequestDto,
  InternalUserInvitationLocaleRequestDto,
) {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class InternalUserStatusRequestDto {
  @ApiProperty()
  @IsBoolean()
  locked: boolean;
}
