'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import type { Message } from '@/types/case';
import { Button, Input } from '@/components/ui';

export default function MessageThread({
  messages,
  currentUserId,
  onSend
}: {
  messages: Message[];
  currentUserId: string;
  onSend: (content: string) => Promise<void>;
}) {
  const t = useTranslations('messages');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      await onSend(content);
      setDraft('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">{t('empty')}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {!mine ? <p className="mb-0.5 text-xs font-medium opacity-80">{m.sender_name}</p> : null}
                  <p>{m.content}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                    {format(new Date(m.created_at), 'dd/MM HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder={t('placeholder')}
        />
        <Button onClick={send} disabled={busy || !draft.trim()}>
          {t('send')}
        </Button>
      </div>
    </section>
  );
}
