'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import AppShell from '@/components/layout/AppShell';
import CaseCard from '@/components/cases/CaseCard';
import { Select } from '@/components/ui';
import { CaseGridSkeleton } from '@/components/ui/Loading';
import { ALL_STATUSES } from '@/lib/case/helpers';
import type { Case } from '@/types/case';

function DashboardContent() {
  const t = useTranslations('dashboard');
  const ts = useTranslations('status');
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.cases
      .list(status ? { status } : undefined)
      .then(setCases)
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [status]);

  const title = useMemo(
    () => (user?.role === 'lab' ? t('labTitle') : t('dentistTitle')),
    [user, t]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          <option value="">{t('filterAll')}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ts(s)}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <CaseGridSkeleton />
      ) : cases.length === 0 ? (
        <p className="text-slate-500">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <CaseCard key={c.id} caseItem={c} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
