import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Logo, { LogoMark } from '@/components/brand/Logo';
import CaseStatusBadge from '@/components/cases/CaseStatusBadge';
import { Button, Input, Select } from '@/components/ui';
import { ALL_STATUSES } from '@/lib/case/helpers';

// Living branding guide — internal reference for the DentalFlow visual system.

const BRAND_SCALE: [string, string][] = [
  ['50', '#ecfdf7'], ['100', '#d0f7ec'], ['200', '#a3efdc'], ['300', '#6ee0c8'],
  ['400', '#38c9ad'], ['500', '#16ad94'], ['600', '#0c8c79'], ['700', '#0c6f63'],
  ['800', '#0e5850'], ['900', '#0f4942'], ['950', '#042f2b']
];

const SUPPORT: [string, string][] = [
  ['ink', '#07211d'], ['porcelain', '#f5f9f7'], ['shade-400', '#e8b873'], ['shade-600', '#c98a3c']
];

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-slate-200/70 py-14">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-7">{children}</div>
    </section>
  );
}

export default function BrandPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-porcelain/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <Logo markSize={30} />
          <Link href="/" className="text-sm text-slate-500 hover:text-ink">
            ← Accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        {/* Intro */}
        <div className="py-16">
          <p className="eyebrow">Guide de marque</p>
          <h1 className="mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
            Le système visuel <span className="text-brand-600">DentalFlow</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Une esthétique « operatory » : la précision clinique d&apos;un cabinet moderne,
            portée par les artefacts du métier — schéma FDI, teintes VITA, et la donnée en
            chiffres.
          </p>
        </div>

        {/* Logo */}
        <Section id="logo" eyebrow="Identité" title="Logo">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card flex items-center justify-center p-8">
              <Logo markSize={36} />
            </div>
            <div className="card flex items-center justify-center p-8">
              <LogoMark size={48} />
            </div>
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-ink p-8">
              <LogoMark size={36} />
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Dental<span className="text-brand-300">Flow</span>
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            La pastille (dent stylisée + dégradé jade) fonctionne seule comme favicon et avatar.
            Le mot-symbole associe <span className="font-display font-bold">Dental</span> (encre) et{' '}
            <span className="font-display font-bold text-brand-600">Flow</span> (jade).
          </p>
        </Section>

        {/* Color */}
        <Section id="color" eyebrow="Couleur" title="Palette">
          <p className="mb-3 text-sm font-semibold text-slate-500">Jade — couleur de marque</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
            {BRAND_SCALE.map(([name, hex]) => (
              <div key={name}>
                <div className="h-14 w-full rounded-lg ring-1 ring-inset ring-black/5" style={{ background: hex }} />
                <p className="data mt-1 text-[0.65rem] text-slate-500">{name}</p>
                <p className="data text-[0.6rem] text-slate-400">{hex}</p>
              </div>
            ))}
          </div>

          <p className="mb-3 mt-8 text-sm font-semibold text-slate-500">Support & accent</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SUPPORT.map(([name, hex]) => (
              <div key={name} className="card overflow-hidden">
                <div className="h-16 w-full" style={{ background: hex }} />
                <div className="p-2">
                  <p className="data text-xs text-slate-600">{name}</p>
                  <p className="data text-[0.65rem] text-slate-400">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section id="type" eyebrow="Typographie" title="Trois rôles">
          <div className="space-y-6">
            <div className="card p-6">
              <p className="eyebrow text-slate-400">Display — Bricolage Grotesque</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-ink">
                Prothèse dentaire, numérisée.
              </p>
            </div>
            <div className="card p-6">
              <p className="eyebrow text-slate-400">Texte — Inter</p>
              <p className="mt-2 max-w-2xl text-slate-600">
                Le corps de texte privilégie la clarté pour les formulaires et les données
                cliniques denses. Sentence case, verbes actifs, aucun remplissage.
              </p>
            </div>
            <div className="card p-6">
              <p className="eyebrow text-slate-400">Donnée — IBM Plex Mono</p>
              <p className="data mt-2 text-2xl text-ink">16 · 17 — A2 — ZIRCONE — #1042</p>
              <p className="mt-2 text-sm text-slate-500">
                Toute valeur clinique (FDI, teinte VITA, référence) est en mono : c&apos;est un code,
                pas une phrase.
              </p>
            </div>
          </div>
        </Section>

        {/* Components */}
        <Section id="components" eyebrow="Composants" title="Éléments d'interface">
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-500">Boutons</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Action principale</Button>
                <Button variant="secondary">Secondaire</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Discret</Button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-500">Champs</p>
              <div className="grid max-w-md gap-3">
                <Input placeholder="ex. AB-1990" />
                <Select defaultValue="">
                  <option value="" disabled>
                    Choisir un type
                  </option>
                  <option>Couronne</option>
                  <option>Bridge</option>
                </Select>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-500">Statuts</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => (
                  <CaseStatusBadge key={s} status={s} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Voice */}
        <Section id="voice" eyebrow="Ton" title="Voix de la marque">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ['Précis, pas bavard', 'On nomme les choses par ce que l’utilisateur contrôle.'],
              ['Le métier d’abord', 'FDI, VITA, types de prothèse : le vocabulaire du prothésiste.'],
              ['Verbes actifs', '« Créer le cas », « Confirmer la réception » — jamais « Soumettre ».'],
              ['Calme et fiable', 'Les erreurs expliquent et orientent, sans s’excuser.']
            ].map(([h, b]) => (
              <li key={h} className="card p-5">
                <p className="font-semibold text-ink">{h}</p>
                <p className="mt-1 text-sm text-slate-500">{b}</p>
              </li>
            ))}
          </ul>
        </Section>

        <footer className="border-t border-slate-200/70 py-10">
          <span className="data text-xs text-slate-400">DENTALFLOW · GUIDE DE MARQUE · 2025</span>
        </footer>
      </main>
    </div>
  );
}
