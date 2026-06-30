'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { PageLoader } from '@/components/ui/Loading';
import type { Role } from '@/types/case';

/**
 * AuthGuard protects client pages: it redirects unauthenticated users to login,
 * and (optionally) users whose role is not allowed back to the dashboard.
 */
export default function AuthGuard({
  children,
  role
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login');
    } else if (role && user.role !== role) {
      router.replace('/dashboard');
    }
  }, [user, loading, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return <>{children}</>;
}
