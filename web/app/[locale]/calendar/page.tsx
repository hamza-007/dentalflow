'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, isSameDay } from 'date-fns';
import { api } from '@/lib/api/client';
import AppShell from '@/components/layout/AppShell';
import DeadlineCalendar from '@/components/cases/DeadlineCalendar';
import CaseCard from '@/components/cases/CaseCard';
import type { Case } from '@/types/case';

function CalendarContent() {
  const t = useTranslations('calendar');
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    api.cases.list().then(setCases).catch(() => setCases([]));
  }, []);

  const dayCases = useMemo(() => {
    if (!selectedDay) return [];
    return cases.filter((c) => isSameDay(new Date(c.due_date), selectedDay));
  }, [cases, selectedDay]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>

      <DeadlineCalendar cases={cases} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {selectedDay ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {t('casesOn', { date: format(selectedDay, 'dd/MM/yyyy') })}
          </h2>
          {dayCases.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noCases')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dayCases.map((c) => (
                <CaseCard key={c.id} caseItem={c} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AppShell>
      <CalendarContent />
    </AppShell>
  );
}
