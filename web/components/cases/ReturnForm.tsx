'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ReturnReason } from '@/types/case';
import { Button, Textarea } from '@/components/ui';

const REASONS: ReturnReason[] = [
  'teinte', 'forme', 'occlusion', 'marge', 'contact', 'axe', 'surface', 'autre'
];

export default function ReturnForm({
  onSubmit
}: {
  onSubmit: (reasons: ReturnReason[], note?: string) => Promise<void>;
}) {
  const t = useTranslations('returns');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ReturnReason[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  function toggle(r: ReturnReason) {
    setSelected((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  async function submit() {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      await onSubmit(selected, note || undefined);
      setOpen(false);
      setSelected([]);
      setNote('');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t('cta')}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
      <h3 className="text-sm font-semibold text-orange-800">{t('title')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(r)} />
            {t(`reasons.${r}`)}
          </label>
        ))}
      </div>
      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('note')} />
      <div className="flex gap-2">
        <Button variant="danger" onClick={submit} disabled={busy || selected.length === 0}>
          {t('submit')}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
