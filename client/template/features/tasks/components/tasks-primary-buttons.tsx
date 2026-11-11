'use client';

import { Download, Plus } from 'lucide-react';

import { useI18n } from '@/template/i18n/provider';
import { Button } from '@/template/components/ui/button';

import { useTasks } from './tasks-provider';

export function TasksPrimaryButtons() {
  const { t } = useI18n();
  const { setOpen } = useTasks();

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="space-x-1" onClick={() => setOpen('import')}>
        <span>{t('Import')}</span> <Download size={18} />
      </Button>
      <Button className="space-x-1" onClick={() => setOpen('create')}>
        <span>{t('Create')}</span> <Plus size={18} />
      </Button>
    </div>
  );
}
