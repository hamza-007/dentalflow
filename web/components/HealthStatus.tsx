'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; db: string }
  | { kind: 'error' };

export default function HealthStatus() {
  const t = useTranslations('home.health');
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    api
      .health()
      .then((h) => {
        if (!active) return;
        setState(
          h.status === 'ok' && h.db === 'ok'
            ? { kind: 'ok', db: h.db }
            : { kind: 'error' }
        );
      })
      .catch(() => {
        if (active) setState({ kind: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  const dot =
    state.kind === 'ok'
      ? 'bg-emerald-500'
      : state.kind === 'error'
        ? 'bg-red-500'
        : 'bg-amber-400 animate-pulse';

  const label =
    state.kind === 'ok'
      ? t('ok')
      : state.kind === 'error'
        ? t('error')
        : t('loading');

  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
      <span className="text-sm font-medium text-slate-700">
        {t('label')}: {label}
      </span>
    </div>
  );
}
