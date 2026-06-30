import createNextIntlPlugin from 'next-intl/plugin';

// Defaults to ./i18n/request.ts
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default withNextIntl(nextConfig);
