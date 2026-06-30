'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

/**
 * Canvas signature pad for the dentist to sign on delivery. Emits a PNG data URL.
 * If an existing signature is provided, it is shown read-only.
 */
export default function SignaturePad({
  existing,
  onSave
}: {
  existing?: string | null;
  onSave: (dataUrl: string) => Promise<void>;
}) {
  const t = useTranslations('signature');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [busy, setBusy] = useState(false);

  if (existing) {
    return (
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={existing} alt={t('title')} className="h-32 rounded border border-slate-200 bg-white" />
        <p className="text-xs text-emerald-600">{t('signed')}</p>
      </section>
    );
  }

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    hasInk.current = false;
  }

  async function save() {
    const c = canvasRef.current;
    if (!c || !hasInk.current) return;
    setBusy(true);
    try {
      await onSave(c.toDataURL('image/png'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
      <p className="text-xs text-slate-500">{t('hint')}</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full max-w-md touch-none rounded-lg border border-dashed border-slate-300 bg-white"
      />
      <div className="flex gap-2">
        <Button onClick={save} disabled={busy}>
          {t('save')}
        </Button>
        <Button variant="ghost" onClick={clear}>
          {t('clear')}
        </Button>
      </div>
    </section>
  );
}
