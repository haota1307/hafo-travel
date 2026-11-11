import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeError(error: unknown): {
  statusCode: number;
  message: string | string[];
} {
  const payload = error instanceof RpcException ? error.getError() : error;
  const outer = record(payload);
  const response = record(
    error instanceof HttpException ? error.getResponse() : outer['response'],
  );
  const nested = record(outer['error']);
  const status = [
    error instanceof HttpException ? error.getStatus() : undefined,
    outer['statusCode'],
    outer['status'],
    response['statusCode'],
    outer['code'],
    nested['code'],
  ].find(
    (value) =>
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= 400 &&
      value <= 599,
  );
  const networkCode = outer['code'];
  const statusCode =
    typeof status === 'number'
      ? status
      : networkCode === 'ECONNREFUSED' || networkCode === 'ECONNRESET'
        ? HttpStatus.SERVICE_UNAVAILABLE
        : networkCode === 'ETIMEDOUT'
          ? HttpStatus.GATEWAY_TIMEOUT
          : HttpStatus.INTERNAL_SERVER_ERROR;
  const message = [
    response['message'],
    outer['message'],
    nested['message'],
    typeof payload === 'string' ? payload : undefined,
  ].find(
    (value) =>
      typeof value === 'string' ||
      (Array.isArray(value) && value.every((item) => typeof item === 'string')),
  );
  return {
    statusCode,
    message:
      (message as string | string[]) ?? HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
  };
}
