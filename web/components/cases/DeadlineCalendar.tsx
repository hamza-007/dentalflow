'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import type { Case } from '@/types/case';
import { deadlineColor, type DeadlineColor } from '@/lib/case/helpers';
import { Button } from '@/components/ui';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const dayColorClasses: Record<DeadlineColor, string> = {
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  red: 'bg-red-500'
};

// Most urgent color wins for a given day's set of cases.
function dayColor(cases: Case[]): DeadlineColor {
  const colors = cases.map((c) => deadlineColor(c.due_date));
  if (colors.includes('red')) return 'red';
  if (colors.includes('orange')) return 'orange';
  return 'green';
}

export default function DeadlineCalendar({
  cases,
  selectedDay,
  onSelectDay
}: {
  cases: Case[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const byDay = useMemo(() => {
    const map = new Map<string, Case[]>();
    for (const c of cases) {
      const key = format(new Date(c.due_date), 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return map;
  }, [cases]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
      }),
    [month]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setMonth((m) => subMonths(m, 1))}>
          ←
        </Button>
        <span className="font-semibold capitalize text-slate-800">{format(month, 'MMMM yyyy')}</span>
        <Button variant="ghost" onClick={() => setMonth((m) => addMonths(m, 1))}>
          →
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayCases = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex h-16 flex-col items-start rounded-lg border p-1.5 text-left text-xs transition-colors ${
                isSelected ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:bg-slate-50'
              } ${inMonth ? 'text-slate-700' : 'text-slate-300'}`}
            >
              <span>{format(day, 'd')}</span>
              {dayCases.length > 0 ? (
                <span
                  className={`mt-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white ${dayColorClasses[dayColor(dayCases)]}`}
                >
                  {dayCases.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
