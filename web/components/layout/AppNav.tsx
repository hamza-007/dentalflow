'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui';
import Logo from '@/components/brand/Logo';
import NotificationsBell from './NotificationsBell';

export default function AppNav() {
  const t = useTranslations('nav');
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/auth/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-porcelain/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" aria-label="DentalFlow">
            <Logo markSize={28} />
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
            {t('dashboard')}
          </Link>
          <Link href="/calendar" className="text-sm text-slate-600 hover:text-slate-900">
            {t('calendar')}
          </Link>
          {user?.role === 'dentist' ? (
            <Link href="/cases/new" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              {t('newCase')}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <span className="hidden text-sm text-slate-500 sm:inline">{user?.clinic_name}</span>
          <Button variant="ghost" onClick={handleLogout}>
            {t('logout')}
          </Button>
        </div>
      </nav>
    </header>
  );
}
