import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestParams = createParamDecorator(
  (param: string, ctx: ExecutionContext) => {
    const payload = ctx.switchToRpc().getData();

    if (param) {
      return payload?.[param];
    }

    return payload?.data ?? payload;
  },
);
