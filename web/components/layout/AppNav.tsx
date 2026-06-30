'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui';
import Logo from '@/components/brand/Logo';
import NotificationsBell from './NotificationsBell';
import LanguageSwitcher from './LanguageSwitcher';

export default function AppNav() {
  const t = useTranslations('nav');
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    setOpen(false);
    logout();
    router.replace('/auth/login');
  }

  const links = (
    <>
      <Link
        href="/dashboard"
        onClick={() => setOpen(false)}
        className="rounded-md px-1 py-2 text-sm text-slate-600 hover:text-slate-900"
      >
        {t('dashboard')}
      </Link>
      <Link
        href="/calendar"
        onClick={() => setOpen(false)}
        className="rounded-md px-1 py-2 text-sm text-slate-600 hover:text-slate-900"
      >
        {t('calendar')}
      </Link>
      {user?.role === 'dentist' ? (
        <Link
          href="/cases/new"
          onClick={() => setOpen(false)}
          className="rounded-md px-1 py-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {t('newCase')}
        </Link>
      ) : null}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-porcelain/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/dashboard" aria-label="DentalFlow">
            <Logo markSize={28} />
          </Link>
          {/* Desktop links */}
          <div className="hidden items-center gap-5 md:flex">{links}</div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <NotificationsBell />
          <span className="hidden max-w-[12rem] truncate text-sm text-slate-500 lg:inline">
            {user?.clinic_name}
          </span>
          <Button variant="ghost" onClick={handleLogout} className="hidden md:inline-flex">
            {t('logout')}
          </Button>
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {open ? (
        <div className="border-t border-slate-200/70 bg-porcelain px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links}
            {user?.clinic_name ? (
              <span className="px-1 py-2 text-sm text-slate-400">{user.clinic_name}</span>
            ) : null}
            <Button variant="secondary" onClick={handleLogout} className="mt-1 w-full">
              {t('logout')}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
