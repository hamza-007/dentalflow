import { differenceInCalendarDays } from 'date-fns';
import type { CaseStatus } from '@/types/case';

export type DeadlineColor = 'green' | 'orange' | 'red';

/** Whole days from today to the due date (negative = overdue). */
export function deadlineDays(dueDate: string): number {
  return differenceInCalendarDays(new Date(dueDate), new Date());
}

/** Deadline color: green > 2 days · orange 1–2 days · red today/overdue (CLAUDE.md §3 / T3.2). */
export function deadlineColor(dueDate: string): DeadlineColor {
  const d = deadlineDays(dueDate);
  if (d <= 0) return 'red';
  if (d <= 2) return 'orange';
  return 'green';
}

export const deadlineColorClasses: Record<DeadlineColor, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  orange: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800'
};

/** Tailwind classes for each status badge. */
export const statusColorClasses: Record<CaseStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  accepted: 'bg-sky-100 text-sky-800',
  designing: 'bg-indigo-100 text-indigo-800',
  fabricating: 'bg-violet-100 text-violet-800',
  checking: 'bg-amber-100 text-amber-800',
  ready: 'bg-teal-100 text-teal-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  correction: 'bg-orange-100 text-orange-800'
};

/** Allowed next statuses for the lab to advance to (mirrors API §6). */
export const nextStatuses: Record<CaseStatus, CaseStatus[]> = {
  new: ['accepted', 'rejected'],
  accepted: ['designing'],
  designing: ['fabricating'],
  fabricating: ['checking'],
  checking: ['ready'],
  ready: ['delivered', 'correction'],
  correction: ['designing'],
  delivered: [],
  rejected: []
};

export const ALL_STATUSES: CaseStatus[] = [
  'new', 'accepted', 'designing', 'fabricating', 'checking', 'ready', 'delivered', 'rejected', 'correction'
];
