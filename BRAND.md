# DentalFlow — Brand Guide

> Living version: run the app and open **`/brand`** (e.g. `http://localhost:3000/brand`).
> This file is the written reference; the tokens live in
> [`web/tailwind.config.ts`](web/tailwind.config.ts) and
> [`web/app/globals.css`](web/app/globals.css).

## Idea

**"Operatory"** — the clean precision of a modern dental clinic, digitized. The
brand leans on the profession's own artifacts (FDI tooth chart, VITA shades, the
case pipeline) instead of generic SaaS decoration. Precise, clinical, trustworthy
— warm enough for daily use.

## Logo

- **Mark:** a stylized tooth on a jade gradient tile (`#38c9ad → #0c6f63`). Works
  alone as favicon / avatar. Source: [`web/components/brand/Logo.tsx`](web/components/brand/Logo.tsx),
  favicon: [`web/app/icon.svg`](web/app/icon.svg).
- **Wordmark:** `Dental` (ink) + `Flow` (jade `brand-600`), set in the display face.
- **Clear space:** keep at least the height of the tile's corner radius around it.
- **Don't:** recolor the tile, stretch it, add shadows/outlines, or set the
  wordmark in another typeface.

## Color

Jade is the brand. Amber ("shade") is the single warm accent — use it sparingly,
mostly for VITA/shade references. Status colors stay semantic and separate.

| Token | Hex | Use |
|---|---|---|
| `brand-600` | `#0c8c79` | **Primary** — buttons, links, active |
| `brand-700` | `#0c6f63` | hover / pressed, gradient end |
| `brand-500` | `#16ad94` | borders, selection, timeline dots |
| `brand-50` | `#ecfdf7` | tints, hover surfaces |
| `ink` | `#07211d` | headings, dark sections, wordmark |
| `porcelain` | `#f5f9f7` | page background |
| `shade-400` | `#e8b873` | warm accent (VITA), used sparingly |
| neutrals | `slate-*` | text & surfaces |
| status | `emerald` / `amber` / `red` | deadlines & case statuses |

## Typography

Three deliberate roles:

- **Display — Bricolage Grotesque** (600–800): headlines, wordmark. Tight tracking.
- **Text — Inter**: all UI and body. Sentence case, active verbs, no filler.
- **Data — IBM Plex Mono**: every clinical value (FDI numbers, VITA shades, case
  refs, eyebrow labels). *It's a code, not a sentence.* Use the `.data` and
  `.eyebrow` helpers.

## Motion

Restrained. One orchestrated page-load reveal (`.reveal`, staggered), gentle hover
lifts. `prefers-reduced-motion` is always respected.

## Voice

- **Precise, not chatty.** Name things by what the user controls.
- **Métier first.** Speak FDI, VITA, prosthesis types — the technician's vocabulary.
- **Active verbs.** "Créer le cas", "Confirmer la réception" — never "Soumettre".
- **Calm and reliable.** Errors explain and direct; they don't apologize or stay vague.
- **French** is the product language (Arabic/RTL is post-MVP).
