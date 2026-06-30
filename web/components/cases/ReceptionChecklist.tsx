'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import type { ReceptionChecklist as Checklist } from '@/types/case';
import { Button } from '@/components/ui';

const ITEMS: (keyof Checklist)[] = [
  'empreinte', 'prescription', 'photos', 'teinte', 'antagoniste', 'occlusion'
];

export default function ReceptionChecklist({
  checklist,
  receivedAt,
  editable,
  onConfirm
}: {
  checklist?: Checklist | null;
  receivedAt?: string | null;
  editable: boolean;
  onConfirm: (checklist: Checklist) => Promise<void>;
}) {
  const t = useTranslations('reception');
  const [state, setState] = useState<Checklist>(checklist ?? {});
  const [busy, setBusy] = useState(false);

  const confirmed = Boolean(receivedAt);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm(state);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
        {confirmed ? (
          <span className="text-xs text-emerald-600">
            {t('confirmedAt', { date: format(new Date(receivedAt as string), 'dd/MM HH:mm') })}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ITEMS.map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              disabled={!editable || confirmed}
              checked={Boolean(state[key])}
              onChange={(e) => setState((s) => ({ ...s, [key]: e.target.checked }))}
            />
            {t(`items.${key}`)}
          </label>
        ))}
      </div>

      {editable && !confirmed ? (
        <Button onClick={confirm} disabled={busy}>
          {t('confirm')}
        </Button>
      ) : null}
    </section>
  );
}
