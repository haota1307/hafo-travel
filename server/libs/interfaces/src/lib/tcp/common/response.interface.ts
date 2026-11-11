import { HttpStatus } from '@nestjs/common';

import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';

export class TcpResponse<T> {
  code: string;
  error?: string;
  data?: T;
  statusCode: number;

  constructor(data: Partial<TcpResponse<T>>) {
    this.code = data.code ?? HTTP_MESSAGE.OK;
    this.error = data.error;
    this.data = data.data;
    this.statusCode = data.statusCode ?? HttpStatus.OK;
  }

  static success<T>(data?: T) {
    return new TcpResponse<T>({
      data,
      statusCode: HttpStatus.OK,
      code: HTTP_MESSAGE.SUCCESS,
    });
  }
}
