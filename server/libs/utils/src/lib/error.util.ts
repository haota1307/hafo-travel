import { Metadata, status as GrpcStatus } from '@grpc/grpc-js';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';

const ERROR_METADATA = 'rpc-error-bin';

const grpcHttpStatuses: Record<number, number> = {
  [GrpcStatus.CANCELLED]: 499,
  [GrpcStatus.UNKNOWN]: 500,
  [GrpcStatus.INVALID_ARGUMENT]: 400,
  [GrpcStatus.DEADLINE_EXCEEDED]: 504,
  [GrpcStatus.NOT_FOUND]: 404,
  [GrpcStatus.ALREADY_EXISTS]: 409,
  [GrpcStatus.PERMISSION_DENIED]: 403,
  [GrpcStatus.RESOURCE_EXHAUSTED]: 429,
  [GrpcStatus.FAILED_PRECONDITION]: 400,
  [GrpcStatus.ABORTED]: 409,
  [GrpcStatus.OUT_OF_RANGE]: 400,
  [GrpcStatus.UNIMPLEMENTED]: 501,
  [GrpcStatus.INTERNAL]: 500,
  [GrpcStatus.UNAVAILABLE]: 503,
  [GrpcStatus.DATA_LOSS]: 500,
  [GrpcStatus.UNAUTHENTICATED]: 401,
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function isMessage(value: unknown): value is string | string[] {
  return (
    typeof value === 'string' ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
}

function grpcErrorDetails(metadata: unknown): Record<string, unknown> {
  if (!(metadata instanceof Metadata)) {
    return {};
  }

  const value = metadata.get(ERROR_METADATA)[0];

  if (!Buffer.isBuffer(value)) {
    return {};
  }

  try {
    return record(JSON.parse(value.toString('utf8')));
  } catch {
    return {};
  }
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
  const details = grpcErrorDetails(outer['metadata']);
  const status = [
    error instanceof HttpException ? error.getStatus() : undefined,
    details['statusCode'],
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
  const grpcStatus =
    typeof networkCode === 'number' ? grpcHttpStatuses[networkCode] : undefined;
  const statusCode =
    typeof status === 'number'
      ? status
      : (grpcStatus ??
        (networkCode === 'ECONNREFUSED' || networkCode === 'ECONNRESET'
          ? HttpStatus.SERVICE_UNAVAILABLE
          : networkCode === 'ETIMEDOUT'
            ? HttpStatus.GATEWAY_TIMEOUT
            : HttpStatus.INTERNAL_SERVER_ERROR));
  const message = [
    response['message'],
    details['message'],
    outer['details'],
    outer['message'],
    nested['message'],
    typeof payload === 'string' ? payload : undefined,
  ].find(isMessage);

  return { statusCode, message: message ?? HTTP_MESSAGE.INTERNAL_SERVER_ERROR };
}

export function toGrpcError(error: unknown): {
  code: GrpcStatus;
  details: string;
  metadata: Metadata;
} {
  const { statusCode, message } = normalizeError(error);
  const codes: Record<number, GrpcStatus> = {
    400: GrpcStatus.INVALID_ARGUMENT,
    401: GrpcStatus.UNAUTHENTICATED,
    403: GrpcStatus.PERMISSION_DENIED,
    404: GrpcStatus.NOT_FOUND,
    408: GrpcStatus.DEADLINE_EXCEEDED,
    409: GrpcStatus.ALREADY_EXISTS,
    422: GrpcStatus.INVALID_ARGUMENT,
    429: GrpcStatus.RESOURCE_EXHAUSTED,
    499: GrpcStatus.CANCELLED,
    501: GrpcStatus.UNIMPLEMENTED,
    502: GrpcStatus.UNAVAILABLE,
    503: GrpcStatus.UNAVAILABLE,
    504: GrpcStatus.DEADLINE_EXCEEDED,
  };
  const metadata = new Metadata();
  metadata.set(
    ERROR_METADATA,
    Buffer.from(JSON.stringify({ statusCode, message }), 'utf8'),
  );

  return {
    code: codes[statusCode] ?? GrpcStatus.INTERNAL,
    details:
      typeof message === 'string' ? message : 'Request validation failed',
    metadata,
  };
}
