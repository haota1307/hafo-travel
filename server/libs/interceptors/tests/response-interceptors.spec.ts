import { Controller, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ClientProxy,
  ClientProxyFactory,
  MessagePattern,
  Payload,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { AddressInfo, Server } from 'node:net';
import { firstValueFrom, of, timeout } from 'rxjs';
import { TcpResponse } from '@common/interfaces/tcp/common/response.interface';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { connectTcpMicroservice } from '../src/lib/connect-tcp-microservice';
import { HttpResponseInterceptor } from '../src/lib/http-response.interceptor';

@Controller()
class ResponseController {
  @MessagePattern('echo')
  async echo(@Payload() data: { value: unknown }) {
    return data.value;
  }

  @MessagePattern('failure')
  failure() {
    throw new RpcException({ code: 400, message: 'Invalid input' });
  }
}

describe('TcpResponse contract', () => {
  let app: INestApplication;
  let client: ClientProxy;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ResponseController],
    }).compile();
    app = module.createNestApplication({ logger: false });
    const tcp = connectTcpMicroservice(app, {
      host: '127.0.0.1',
      port: 0,
    });
    await app.startAllMicroservices();
    const { port } = tcp.unwrap<Server>().address() as AddressInfo;
    client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port },
    });
    await client.connect();
  });

  afterAll(async () => {
    client?.close();
    await app?.close();
  });

  it.each([
    HTTP_MESSAGE.CREATED,
    null,
    false,
    0,
    { id: 'user-1', data: { nested: true } },
  ])('preserves the TCP contract for %p', async (value) => {
    const response = await firstValueFrom(
      client.send('echo', { value }).pipe(timeout(3000)),
    );
    expect(response).toEqual(
      JSON.parse(JSON.stringify(TcpResponse.success(value))),
    );
  });

  it('propagates RPC errors instead of turning them into success responses', async () => {
    await expect(
      firstValueFrom(client.send('failure', {}).pipe(timeout(3000))),
    ).rejects.toMatchObject({ code: 400, message: 'Invalid input' });
  });

  it.each([
    null,
    HTTP_MESSAGE.CREATED,
    { accessToken: 'token', refreshToken: 'refresh' },
  ])('preserves BFF fields without double wrapping %p', async (value) => {
    const envelope = JSON.parse(JSON.stringify(TcpResponse.success(value)));
    const request = { processId: 'request-1', startTime: 100 };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const clock = jest.spyOn(Date, 'now').mockReturnValue(125);
    try {
      const result = await firstValueFrom(
        new HttpResponseInterceptor().intercept(context, {
          handle: () => of(envelope),
        }),
      );
      expect(result).toEqual(
        Object.assign(new ResponseDto(envelope), {
          processId: 'request-1',
          duration: '25 ms',
        }),
      );
      expect(result.data).toEqual(value);
      expect(envelope).not.toHaveProperty('processId');
    } finally {
      clock.mockRestore();
    }
  });
});
