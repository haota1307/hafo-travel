import { HttpStatus } from '@nestjs/common';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { ApiProperty } from '@nestjs/swagger';

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
