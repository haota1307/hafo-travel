import { Logger } from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsString, validateSync } from 'class-validator';

export class BaseConfiguration {
  @IsString()
  NODE_ENV: string;

  @IsBoolean()
  IS_DEV: boolean;

  @IsString()
  @IsNotEmpty()
  GLOBAL_PREFIX: string;

  constructor() {
    this.NODE_ENV = process.env['NODE_ENV'] || 'development';
    this.GLOBAL_PREFIX = process.env['GLOBAL_PREFIX'] || '';
    this.IS_DEV = this.NODE_ENV === 'development';
  }

  validate() {
    const errors = validateSync(this, {
      validationError: { target: false, value: false },
    });

    if (errors.length > 0) {
      Logger.error(errors, 'Configuration validation failed');

      throw new Error('Configuration is invalid');
    }
  }
}
