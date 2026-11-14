import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { PERMISSION } from '@common/constants/enum/role.enum';

export class SaveRoleRequestDto {
  @ApiProperty({ example: 'operator' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/)
  @MaxLength(64)
  name: string;

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
