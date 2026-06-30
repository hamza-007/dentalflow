import { defineRouting } from 'next-intl/routing';

// ar (RTL) is the default; fr is selectable. Locale-prefixed only for non-default
// (default ar → /…, fr → /fr/…).
// localeDetection: false → always default to ar, ignoring the browser's
// Accept-Language and any saved cookie. French is reached only via the /fr URL
// (the language switcher navigates there explicitly).
export const routing = defineRouting({
  locales: ['ar', 'fr'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed',
  localeDetection: false
});

// Right-to-left locales.
const RTL_LOCALES = new Set<string>(['ar']);
export function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}

export type Locale = (typeof routing.locales)[number];
