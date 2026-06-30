'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import type { CaseStatus, StatusEvent } from '@/types/case';
import { nextStatuses } from '@/lib/case/helpers';
import { Button, Input, Select } from '@/components/ui';

export default function CaseTimeline({
  events,
  currentStatus,
  canAdvance,
  onAdvance
}: {
  events: StatusEvent[];
  currentStatus: CaseStatus;
  canAdvance: boolean;
  onAdvance: (status: CaseStatus, note?: string) => Promise<void>;
}) {
  const t = useTranslations('timeline');
  const ts = useTranslations('status');
  const [target, setTarget] = useState<CaseStatus | ''>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const options = nextStatuses[currentStatus];

  async function advance() {
    if (!target) return;
    setBusy(true);
    try {
      await onAdvance(target, note || undefined);
      setTarget('');
      setNote('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>

      {events.length === 0 ? (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      ) : (
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <p className="text-sm font-medium text-slate-800">{ts(e.to_status)}</p>
              <p className="text-xs text-slate-500">
                {format(new Date(e.created_at), 'dd/MM/yyyy HH:mm')}
                {e.changed_by_name ? ` · ${t('by', { name: e.changed_by_name })}` : ''}
              </p>
              {e.note ? <p className="mt-1 text-sm text-slate-600">{e.note}</p> : null}
            </li>
          ))}
        </ol>
      )}

      {canAdvance && options.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex-1">
            <Select value={target} onChange={(e) => setTarget(e.target.value as CaseStatus)}>
              <option value="">{t('moveTo')}</option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {ts(s)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
            />
          </div>
          <Button onClick={advance} disabled={!target || busy}>
            {t('advance')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
