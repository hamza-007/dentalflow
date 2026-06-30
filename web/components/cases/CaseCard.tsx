'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Case } from '@/types/case';
import { getProsthesisType } from '@/lib/constants/prosthesisTypes';
import { deadlineColor, deadlineColorClasses, deadlineDays } from '@/lib/case/helpers';
import CaseStatusBadge from './CaseStatusBadge';

export default function CaseCard({ caseItem }: { caseItem: Case }) {
  const t = useTranslations('case');
  const days = deadlineDays(caseItem.due_date);
  const color = deadlineColor(caseItem.due_date);

  const deadlineLabel =
    days < 0 ? t('overdue', { days: -days }) : days === 0 ? t('dueToday') : t('dueIn', { days });

  const typeLabel = getProsthesisType(caseItem.prosthesis_type)?.label ?? caseItem.prosthesis_type;

  return (
    <Link
      href={`/cases/${caseItem.id}`}
      className="block rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{caseItem.patient_ref}</p>
          <p className="text-sm text-slate-500">{typeLabel}</p>
        </div>
        <CaseStatusBadge status={caseItem.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded bg-slate-100 px-2 py-0.5">
          {t('teeth')}: {caseItem.teeth.join(', ')}
        </span>
        {caseItem.priority === 'urgent' ? (
          <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">
            {t('priorityUrgent')}
          </span>
        ) : null}
        <span className={`rounded px-2 py-0.5 font-medium ${deadlineColorClasses[color]}`}>
          {deadlineLabel}
        </span>
      </div>
    </Link>
  );
}
