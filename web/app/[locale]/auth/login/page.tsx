'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { loginSchema, type LoginValues } from '@/lib/schemas/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { ApiClientError } from '@/lib/api/client';
import { Button, Field, Input } from '@/components/ui';
import Logo from '@/components/brand/Logo';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setFormError(t('errorInvalid'));
      } else {
        setFormError(t('errorGeneric'));
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Logo className="mb-6 self-center" markSize={38} />
      <div className="card space-y-6 p-8">
        <h1 className="text-2xl font-bold text-ink">{t('loginTitle')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t('email')} required error={errors.email && tv(errors.email.message as string)}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label={t('password')} required error={errors.password && tv(errors.password.message as string)}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </Field>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          {t('submitLogin')}
        </Button>
        </form>

        <p className="text-sm text-slate-600">
          {t('noAccount')}{' '}
          <Link href="/auth/register" className="font-medium text-brand-600 hover:underline">
            {t('goRegister')}
          </Link>
        </p>
      </div>
    </main>
  );
}
