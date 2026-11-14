import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';

export class ResponseDto<T> {
  @ApiProperty({ type: String })
  processId?: string;

  @ApiProperty({ type: String })
  duration?: string;

  @ApiProperty({ type: String })
  message: string | string[] = HTTP_MESSAGE.SUCCESS;

  @ApiProperty({ type: Number })
  statusCode = HttpStatus.OK;

  @ApiProperty({ type: Object })
  data?: T;

  @ApiProperty({ type: String, required: false })
  code?: string;

  constructor(data: Partial<ResponseDto<T>>) {
    Object.assign(this, data);
  }
}
