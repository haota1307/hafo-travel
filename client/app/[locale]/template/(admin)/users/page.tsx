import { Suspense } from 'react';

import { Users } from '@/template/features/users';
import { Trans } from '@/template/i18n/provider';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-8" role="status">
          <Trans message="Loading users..." />
        </div>
      }
    >
      <Users />
    </Suspense>
  );
}
