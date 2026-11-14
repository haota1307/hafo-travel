import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsString,
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SetUserRolesRequestDto {
  @ApiProperty({ type: [String], minItems: 1, maxItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsMongoId({ each: true })
  roles: string[];
}
