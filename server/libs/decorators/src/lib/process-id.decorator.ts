import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { MetadataKeys } from '@common/constants/common.constants';
import { getProcessId } from '@common/utils/string.util';

export const ProcessId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const payload = ctx.switchToRpc().getData();
    return payload?.[MetadataKeys.PROCESS_ID] || getProcessId();
  },
);
