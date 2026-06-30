'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { registerSchema, type RegisterValues } from '@/lib/schemas/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { ApiClientError } from '@/lib/api/client';
import { Button, Field, Input, RequiredLegend, Select } from '@/components/ui';
import Logo from '@/components/brand/Logo';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await registerUser(values);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'email_exists') {
        setFormError(t('errorEmailExists'));
      } else {
        setFormError(t('errorGeneric'));
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>
      <Logo className="mb-6 self-center" markSize={38} />
      <div className="card space-y-5 p-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('registerTitle')}</h1>
          <div className="mt-2">
            <RequiredLegend />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t('role')} required error={errors.role && tv(errors.role.message as string)}>
          <Select defaultValue="" {...register('role')}>
            <option value="" disabled>
              —
            </option>
            <option value="dentist">{t('roleDentist')}</option>
            <option value="lab">{t('roleLab')}</option>
          </Select>
        </Field>

        <Field label={t('fullName')} required error={errors.full_name && tv(errors.full_name.message as string)}>
          <Input {...register('full_name')} />
        </Field>
        <Field label={t('clinicName')} required error={errors.clinic_name && tv(errors.clinic_name.message as string)}>
          <Input {...register('clinic_name')} />
        </Field>
        <Field label={t('email')} required error={errors.email && tv(errors.email.message as string)}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label={t('password')} required error={errors.password && tv(errors.password.message as string)}>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('phone')} optional>
            <Input {...register('phone')} />
          </Field>
          <Field label={t('city')} optional>
            <Input {...register('city')} />
          </Field>
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          {t('submitRegister')}
        </Button>
        </form>

        <p className="text-sm text-slate-600">
          {t('haveAccount')}{' '}
          <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
            {t('goLogin')}
          </Link>
        </p>
      </div>
    </main>
  );
}
