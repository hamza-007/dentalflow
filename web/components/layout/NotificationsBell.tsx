'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api/client';
import { LoadingDots } from '@/components/ui/Loading';
import type { Notification } from '@/types/case';

const POLL_MS = 20000;

export default function NotificationsBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(() => {
    api.notifications
      .unreadCount()
      .then((r) => setUnread(r.unread))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, POLL_MS);
    return () => clearInterval(t);
  }, [loadCount]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setListLoading(true);
      const list = await api.notifications.list().catch(() => []);
      setItems(list);
      setListLoading(false);
    }
  }

  async function markAllRead() {
    await api.notifications.markAllRead();
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-semibold text-slate-700">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">
              Tout marquer lu
            </button>
          </div>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {listLoading ? (
              <li className="flex justify-center py-8">
                <LoadingDots />
              </li>
            ) : items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-400">Aucune notification</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className={`px-4 py-3 text-sm ${n.read ? 'bg-white' : 'bg-brand-50'}`}>
                  <p className="text-slate-700">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {format(new Date(n.created_at), 'dd/MM HH:mm')}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
