import { BadRequestException, type ExecutionContext } from '@nestjs/common';
import { Metadata, status as GrpcStatus } from '@grpc/grpc-js';
import { firstValueFrom, of } from 'rxjs';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { normalizeError, toGrpcError } from '@common/utils/error.util';
import { requestGrpcData, PROCESS_ID_METADATA } from '@common/utils/rpc.util';
import { HttpResponseInterceptor } from '../src/lib/http-response.interceptor';

describe('gRPC and HTTP response boundaries', () => {
  it.each([
    null,
    false,
    0,
    HTTP_MESSAGE.CREATED,
    { accessToken: 'token', refreshToken: 'refresh' },
  ])(
    'wraps raw service data once and keeps the HTTP contract for %p',
    async (value) => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ processId: 'request-1', startTime: 100 }),
        }),
      } as unknown as ExecutionContext;
      const clock = jest.spyOn(Date, 'now').mockReturnValue(125);

      try {
        const result = await firstValueFrom(
          new HttpResponseInterceptor().intercept(context, {
            handle: () => of(value),
          }),
        );

        expect(result).toMatchObject({
          data: value,
          code: HTTP_MESSAGE.SUCCESS,
          message: HTTP_MESSAGE.SUCCESS,
          statusCode: 200,
          processId: 'request-1',
          duration: '25 ms',
        });
      } finally {
        clock.mockRestore();
      }
    },
  );

  it('preserves validation arrays and Unicode through binary error metadata', () => {
    const messages = ['Email không hợp lệ', 'Thiếu họ tên'];
    const error = toGrpcError(new BadRequestException(messages));

    expect(error.code).toBe(GrpcStatus.INVALID_ARGUMENT);
    expect(normalizeError(error)).toEqual({
      statusCode: 400,
      message: messages,
    });
  });

  it.each([
    [GrpcStatus.UNAUTHENTICATED, 401],
    [GrpcStatus.PERMISSION_DENIED, 403],
    [GrpcStatus.NOT_FOUND, 404],
    [GrpcStatus.UNAVAILABLE, 503],
    [GrpcStatus.DEADLINE_EXCEEDED, 504],
  ])(
    'maps native gRPC status %s to HTTP %s without private metadata',
    (code, statusCode) =>
      expect(normalizeError({ code, details: 'Failure' })).toEqual({
        statusCode,
        message: 'Failure',
      }),
  );

  it('passes correlation metadata and the incoming deadline into native call options', async () => {
    const deadline = Date.now() + 1500;
    const method = jest.fn(() => of({ ok: true }));

    await expect(
      requestGrpcData(
        method,
        { value: 1 },
        { processId: 'request-1', deadline },
        5000,
      ),
    ).resolves.toEqual({ ok: true });
    expect(method).toHaveBeenCalledWith({ value: 1 }, expect.any(Metadata), {
      deadline,
    });
    expect(
      (method.mock.calls[0] as unknown as [unknown, Metadata])[1].get(
        PROCESS_ID_METADATA,
      ),
    ).toEqual(['request-1']);
  });

  it('rejects an expired deadline before dispatching an RPC', async () => {
    const method = jest.fn(() => of({ ok: true }));

    await expect(
      requestGrpcData(method, {}, { deadline: Date.now() - 1 }),
    ).rejects.toMatchObject({ status: 504 });
    expect(method).not.toHaveBeenCalled();
  });
});
