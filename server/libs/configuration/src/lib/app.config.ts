import { envNumber } from '@common/utils/env-number.util';
import { IsNumber } from 'class-validator';

export class AppConfiguration {
  @IsNumber()
  PORT: number;

  constructor() {
    this.PORT = envNumber('PORT', 3300, undefined, 1, 65535);
  }
}
