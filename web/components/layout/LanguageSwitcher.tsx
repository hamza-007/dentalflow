'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LABELS: Record<string, string> = { fr: 'FR', ar: 'ع' };

/** FR / AR locale toggle. Switches locale while keeping the current path. */
export default function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      role="group"
      aria-label={t('language')}
      className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-current={l === locale}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
            l === locale ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-ink'
          }`}
        >
          {LABELS[l] ?? l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
