import { Suspense } from 'react';

import { Tasks } from '@/template/features/tasks';
import { Trans } from '@/template/i18n/provider';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-8" role="status">
          <Trans message="Loading tasks..." />
        </div>
      }
    >
      <Tasks />
    </Suspense>
  );
}
