import { defineRouting } from 'next-intl/routing';

// fr is the default and only locale for the MVP. Arabic/RTL is post-MVP (CLAUDE.md §2).
export const routing = defineRouting({
  locales: ['fr'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed'
});

export type Locale = (typeof routing.locales)[number];
