'use client';

import { toast } from 'sonner';

import { Trans } from '../i18n/provider';

export function showSubmittedData(
  data: unknown,
  title: string = 'You submitted the following values:',
) {
  toast.message(<Trans message={title} />, {
    description: (
      <pre className="mt-2 w-full overflow-x-auto rounded-md bg-slate-950 p-4">
        <code className="text-white">{JSON.stringify(data, null, 2)}</code>
      </pre>
    ),
  });
}
