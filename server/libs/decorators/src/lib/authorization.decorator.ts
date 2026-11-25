import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { MetadataKeys } from '@common/constants/common.constants';

export const Authorization = ({ secured = false }: { secured?: boolean }) => {
  const setMetadata = SetMetadata(MetadataKeys.SECURED, {
    secured,
  });

  if (secured) {
    return applyDecorators(
      setMetadata,
      ApiBearerAuth(),
      ApiUnauthorizedResponse({ description: 'Authentication is required' }),
    );
  }

  return setMetadata;
};
