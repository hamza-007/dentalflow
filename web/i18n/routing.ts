import { defineRouting } from 'next-intl/routing';

// ar (RTL) is the default; fr is selectable. Locale-prefixed only for non-default
// (default ar → /…, fr → /fr/…).
export const routing = defineRouting({
  locales: ['ar', 'fr'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed'
});

// Right-to-left locales.
const RTL_LOCALES = new Set<string>(['ar']);
export function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}

export type Locale = (typeof routing.locales)[number];
