import { Reflector } from '@nestjs/core';

import { PERMISSION } from '@common/constants/enum/role.enum';

export const Permissions = Reflector.createDecorator<PERMISSION[]>();
