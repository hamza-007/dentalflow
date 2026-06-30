import createNextIntlPlugin from 'next-intl/plugin';

// Defaults to ./i18n/request.ts
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emits a minimal self-contained server (.next/standalone) for Docker.
  output: 'standalone'
};

export default withNextIntl(nextConfig);
