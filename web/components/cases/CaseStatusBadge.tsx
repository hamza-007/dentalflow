'use client';

import { useTranslations } from 'next-intl';
import type { CaseStatus } from '@/types/case';
import { statusColorClasses } from '@/lib/case/helpers';

export default function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const t = useTranslations('status');
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColorClasses[status]}`}
    >
      {t(status)}
    </span>
  );
}
