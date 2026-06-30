import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutGrid,
  MessageSquare
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Logo, { LogoMark } from '@/components/brand/Logo';
import Reveal from '@/components/ui/Reveal';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { UPPER_TEETH } from '@/lib/constants/toothChart';

export default async function HomePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('landing');
  const ts = await getTranslations('status');

  const features = [
    { icon: ClipboardList, label: t('features.prescriptionLabel'), title: t('features.prescriptionTitle'), body: t('features.prescriptionBody') },
    { icon: LayoutGrid, label: t('features.chartLabel'), title: t('features.chartTitle'), body: t('features.chartBody') },
    { icon: Activity, label: t('features.timelineLabel'), title: t('features.timelineTitle'), body: t('features.timelineBody') },
    { icon: MessageSquare, label: t('features.messagingLabel'), title: t('features.messagingTitle'), body: t('features.messagingBody') },
    { icon: CalendarDays, label: t('features.calendarLabel'), title: t('features.calendarTitle'), body: t('features.calendarBody') },
    { icon: FileText, label: t('features.deliveryLabel'), title: t('features.deliveryTitle'), body: t('features.deliveryBody') }
  ];

  const workflow = ['new', 'accepted', 'designing', 'fabricating', 'checking', 'ready', 'delivered'];

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-porcelain/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo markSize={30} />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/auth/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-ink sm:block"
            >
              {t('loginCta')}
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:px-4"
            >
              {t('registerCta')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-clinic opacity-60" aria-hidden />
        {/* Animated aurora */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 animate-float-slow rounded-full bg-brand-300/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-24 top-40 h-80 w-80 animate-float rounded-full bg-cyan-300/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-72 w-72 animate-float-slow rounded-full bg-shade-200/40 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <p className="eyebrow reveal">{t('eyebrow')}</p>
            <h1
              className="reveal mt-5 text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-6xl"
              style={{ animationDelay: '60ms' }}
            >
              {t('h1a')}
              <br />
              <span className="text-gradient">{t('h1b')}</span>
            </h1>
            <p
              className="reveal mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
              style={{ animationDelay: '120ms' }}
            >
              {t('sub')}
            </p>
            <div className="reveal mt-8 flex flex-wrap gap-3" style={{ animationDelay: '180ms' }}>
              <Link
                href="/auth/register"
                className="rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
              >
                {t('registerCta')}
              </Link>
              <Link
                href="/auth/login"
                className="rounded-xl border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur transition-colors hover:border-brand-400 hover:text-ink"
              >
                {t('loginCta')}
              </Link>
            </div>
            <p
              className="reveal mt-8 max-w-md text-sm text-slate-500"
              style={{ animationDelay: '240ms' }}
            >
              {t('trust')}
            </p>
          </div>

          {/* Signature: a live case card built from the product's own artifacts */}
          <div className="reveal lg:justify-self-end" style={{ animationDelay: '160ms' }}>
            <HeroCaseCard
              labels={{
                case: t('card.case'),
                status: t('card.status'),
                patient: t('card.patient'),
                type: t('card.type'),
                material: t('card.material'),
                shade: t('card.shade'),
                deadline: t('card.deadline'),
                due: t('card.dueValue')
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Problem → Solution ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-slate-200/70 bg-white/60 p-8">
              <p className="eyebrow text-slate-400">{t('problem.eyebrow')}</p>
              <h2 className="mt-4 text-2xl font-bold text-slate-800">{t('problem.title')}</h2>
              <p className="mt-3 leading-relaxed text-slate-500">{t('problem.body')}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
          <div className="card relative h-full overflow-hidden p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-100/60 blur-2xl" aria-hidden />
            <p className="eyebrow">{t('problem.solutionEyebrow')}</p>
            <h2 className="mt-4 text-2xl font-bold text-ink">{t('problem.solutionTitle')}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {['WhatsApp', 'Téléphone', 'Cahiers', 'Bons papier'].map((x) => (
                <span
                  key={x}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-400 line-through"
                >
                  {x}
                </span>
              ))}
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                DentalFlow
              </span>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow">{t('features.eyebrow')}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold text-ink sm:text-4xl">
          {t('features.title')}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, label, title, body }, i) => (
            <Reveal key={label} delay={i * 70} className="h-full">
              <div className="card group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-all duration-300 group-hover:bg-brand-gradient group-hover:text-white group-hover:ring-transparent">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <p className="eyebrow mt-5 text-[0.65rem] text-slate-400">{label}</p>
                <h3 className="mt-1.5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Workflow pipeline ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow">{t('workflow.eyebrow')}</p>
        <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{t('workflow.title')}</h2>
        <Reveal>
          <ol className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-4">
            {workflow.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-ink">
                  <span className="data text-xs text-brand-500">{String(i + 1).padStart(2, '0')}</span>
                  {ts(s)}
                </span>
                {i < workflow.length - 1 ? <span className="text-slate-300">→</span> : null}
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* ── CTA band ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient bg-[length:200%_200%] px-8 py-14 text-center shadow-glow animate-shimmer sm:px-16">
          <div className="absolute inset-0 grid-clinic opacity-20" aria-hidden />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 animate-float rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-3xl font-bold text-white sm:text-4xl">
              {t('ctaBand.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/85">{t('ctaBand.body')}</p>
            <Link
              href="/auth/register"
              className="mt-8 inline-flex rounded-xl bg-white px-7 py-3 text-sm font-semibold text-ink shadow-lift transition-transform hover:-translate-y-0.5"
            >
              {t('ctaBand.button')}
            </Link>
          </div>
        </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="text-sm text-slate-500">{t('footer.tagline')}</span>
          </div>
          <span className="data text-xs text-slate-400">DENTALFLOW · {t('footer.rights')}</span>
        </div>
      </footer>
    </div>
  );
}

// ── Hero case card: the signature element, built from real product artifacts ──
function HeroCaseCard({
  labels
}: {
  labels: {
    case: string;
    status: string;
    patient: string;
    type: string;
    material: string;
    shade: string;
    deadline: string;
    due: string;
  };
}) {
  const selected = new Set(['16', '17']);
  const tw = 13;
  const gap = 3;
  const pad = 8;
  const width = pad * 2 + UPPER_TEETH.length * (tw + gap) - gap;

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lift">
      <div className="flex items-center justify-between">
        <span className="data text-xs text-slate-400">
          {labels.case.toUpperCase()} #1042
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
          <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-brand-500" />
          {labels.status}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">{labels.patient}</p>
        <p className="data mt-0.5 text-2xl font-semibold text-ink">AB · 1990</p>
      </div>

      {/* Mini FDI arch */}
      <svg
        viewBox={`0 0 ${width} 40`}
        className="mt-5 w-full"
        role="img"
        aria-label="16 · 17"
      >
        {UPPER_TEETH.map((fdi, i) => {
          const isSel = selected.has(fdi);
          return (
            <rect
              key={fdi}
              x={pad + i * (tw + gap)}
              y={6}
              width={tw}
              height={28}
              rx={4}
              className={isSel ? 'fill-brand-500' : 'fill-slate-100'}
              style={{ animation: 'pop 0.5s ease both', animationDelay: `${200 + i * 30}ms` }}
            />
          );
        })}
      </svg>
      <p className="data mt-1 text-xs text-brand-600">16 · 17 — maxillaire</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {labels.type}
        </span>
        <span className="data rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          {labels.material.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-shade-100 px-2.5 py-1 text-xs font-medium text-shade-600">
          <span className="h-2.5 w-2.5 rounded-full bg-shade-400" />
          {labels.shade} A2
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex origin-left items-center gap-1.5">
          {[true, true, true, false].map((done, i) => (
            <span
              key={i}
              className={`h-1.5 origin-left rounded-full ${done ? 'w-7 bg-brand-500' : 'w-4 bg-slate-200'}`}
              style={{ animation: 'pop 0.5s ease both', animationDelay: `${700 + i * 90}ms` }}
            />
          ))}
        </div>
        <span className="data rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          {labels.deadline} {labels.due}
        </span>
      </div>
    </div>
  );
}
