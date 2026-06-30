'use client';

import AuthGuard from '@/lib/auth/AuthGuard';
import AppNav from './AppNav';
import type { Role } from '@/types/case';

/** AppShell = auth protection + top nav + a centered content container. */
export default function AppShell({
  children,
  role
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  return (
    <AuthGuard role={role}>
      <AppNav />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </AuthGuard>
  );
}
