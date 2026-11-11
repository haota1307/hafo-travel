import { INestApplication } from '@nestjs/common';
import { TcpOptions, Transport } from '@nestjs/microservices';
import { TcpLoggingInterceptor } from './tcp-logging.interceptor';
import { TcpResponseInterceptor } from './tcp-response.interceptor';

/** Attach TCP interceptors before Nest registers message handlers. */
export function connectTcpMicroservice(
  app: INestApplication,
  endpoint: { host?: string; port?: number },
) {
  const service = app.connectMicroservice<TcpOptions>(
    {
      transport: Transport.TCP,
      options: { host: endpoint.host, port: endpoint.port },
    },
    {
      deferInitialization: true,
    },
  );
  service.useGlobalInterceptors(
    new TcpLoggingInterceptor(),
    new TcpResponseInterceptor(),
  );
  return service;
}
