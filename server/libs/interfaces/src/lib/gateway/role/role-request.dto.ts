import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { PERMISSION } from '@common/constants/enum/role.enum';

function trimDisplayName({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class SaveRoleRequestDto {
  @ApiProperty({ example: 'operator' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/)
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 100 })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(trimDisplayName)
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
    example: 'Điều hành tour',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(trimDisplayName)
  @IsString()
  @Length(1, 100)
  displayNameVi?: string;

  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
    example: 'Tour operator',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(trimDisplayName)
  @IsString()
  @Length(1, 100)
  displayNameEn?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ enum: PERMISSION, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsEnum(PERMISSION, { each: true })
  permissions: PERMISSION[];
}
