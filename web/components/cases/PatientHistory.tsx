'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { getProsthesisType } from '@/lib/constants/prosthesisTypes';
import type { Case } from '@/types/case';

/** Shows other cases for the same anonymized patient (reproducibility, Pb#7). */
export default function PatientHistory({
  patientRef,
  currentCaseId
}: {
  patientRef: string;
  currentCaseId: string;
}) {
  const t = useTranslations('patient');
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    api.cases
      .patientHistory(patientRef)
      .then((list) => setCases(list.filter((c) => c.id !== currentCaseId)))
      .catch(() => setCases([]));
  }, [patientRef, currentCaseId]);

  if (cases.length === 0) return null;

  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
      <ul className="divide-y divide-slate-100 text-sm">
        {cases.map((c) => (
          <li key={c.id}>
            <Link
              href={`/cases/${c.id}`}
              className="flex items-center justify-between py-2 hover:text-brand-600"
            >
              <span>
                {getProsthesisType(c.prosthesis_type)?.label ?? c.prosthesis_type} · {c.teeth.join(', ')}
                {c.shade ? ` · ${c.shade}` : ''}
              </span>
              <span className="text-xs text-slate-400">
                {format(new Date(c.created_at), 'dd/MM/yyyy')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
