// DentalFlow logo: a tooth glyph in a gradient tile + wordmark.

export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="df-logo-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38c9ad" />
          <stop offset="1" stopColor="#0c6f63" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill="url(#df-logo-grad)" />
      {/* Stylised tooth */}
      <path
        d="M16 7.2c-4.1 0-7 2.7-7 7 0 3.3.9 6.4 2.2 8.7.5.9 1.2 1.7 2 1.7 1.2 0 1.4-2.3 1.7-3.8.2-.9.6-1.6 1.1-1.6.5 0 .9.7 1.1 1.6.3 1.5.5 3.8 1.7 3.8.8 0 1.5-.8 2-1.7 1.3-2.3 2.2-5.4 2.2-8.7 0-4.3-2.9-7-7-7z"
        fill="#ffffff"
      />
      {/* Flow accent */}
      <circle cx="23" cy="10" r="1.6" fill="#ecfdf7" opacity="0.9" />
    </svg>
  );
}

export default function Logo({
  variant = 'full',
  markSize = 32,
  className = ''
}: {
  variant?: 'full' | 'mark';
  markSize?: number;
  className?: string;
}) {
  if (variant === 'mark') {
    return <LogoMark size={markSize} className={className} />;
  }
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={markSize} />
      <span className="text-xl font-bold tracking-tight text-ink">
        Dental<span className="text-brand-600">Flow</span>
      </span>
    </span>
  );
}
