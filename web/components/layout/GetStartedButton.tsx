'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Spinner } from '@/components/ui';

// Demo accounts created by `go run ./cmd/seed`.
const DEMO: Record<'dentist' | 'lab', string> = {
  dentist: 'demo.dentist@dentalflow.tn',
  lab: 'demo.lab@dentalflow.tn'
};
const DEMO_PASSWORD = 'password123';

/**
 * Starts a demo session for the chosen role and enters the app. No login screen —
 * "open/demo mode" entry from the landing page.
 */
export default function GetStartedButton({
  role = 'dentist',
  className = '',
  children
}: {
  role?: 'dentist' | 'lab';
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('landing');
  const { login } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await login(DEMO[role], DEMO_PASSWORD);
      router.push('/dashboard');
    } catch {
      setBusy(false);
      alert(t('demoError'));
    }
  }

  return (
    <button type="button" onClick={go} disabled={busy} className={className}>
      {busy ? <Spinner size={16} /> : null}
      {children}
    </button>
  );
}
