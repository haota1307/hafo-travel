import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Metadata } from '@grpc/grpc-js';
import type { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import { grpcCallContext } from '@common/utils/rpc.util';
import { getProcessId } from '@common/utils/string.util';

export const ProcessId = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    if (context.getType() === 'http') {
      return (
        context.switchToHttp().getRequest<RequestContext>().processId ||
        getProcessId()
      );
    }

    return grpcCallContext(context.switchToRpc().getContext<Metadata>())
      .processId;
  },
);
