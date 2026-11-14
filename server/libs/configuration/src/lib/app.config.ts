import { IsNumber } from 'class-validator';

import { envNumber } from './env-number';

export class AppConfiguration {
  @IsNumber()
  PORT: number;

  constructor() {
    this.PORT = envNumber('PORT', 3300, undefined, 1, 65535);
  }
}
