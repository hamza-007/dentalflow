# DentalFlow 🦷

A cloud platform that connects **dental labs** (prothésistes) with **dentists** in
Tunisia — replacing WhatsApp, phone calls, and paper slips with one structured
digital workflow for prosthesis cases.

**Bilingual: Arabic (RTL, default) · French.** UI built mobile-first.

> The core loop: a dentist creates a case (type, teeth, photos, deadline) → the lab
> accepts and advances it step by step → both sides message inside the case → the
> lab delivers and the dentist confirms with a signed PDF.

---

## Features

- **Cases** — adaptive prescription form per prosthesis type (9 types), clickable
  **FDI tooth chart**, VITA shades, priority & deadline.
- **Dashboards** — lab sees received cases, dentist sees their own; deadline color
  alerts (green / orange / red).
- **Status workflow & timeline** — validated transitions, every change timestamped;
  the dentist sees progress live (polling).
- **Messaging** — threaded, per-case (no more WhatsApp).
- **Files** — drag-and-drop photos/scans; a finished-prosthesis photo is required
  before delivery.
- **Deadline calendar** — monthly view, color-coded by urgency.
- **Delivery note** — auto-generated PDF + on-screen **digital signature**.
- **Returns & corrections** — structured motifs; **patient history** by anonymized
  reference; **reception checklist**; **in-app notifications** (email/SMS stubbed).
- **Prosthesis Studio (V2)** — a generic **3D preview** of the whole prosthesis on
  the dental arch (watermarked, visualization-only) and an auto-assembled French
  **fiche de fabrication** grounded in a curated manufacturer knowledge base, where
  **every numeric parameter is cited** (a guardrail rejects any uncited value).

---

## Tech stack

| | |
|---|---|
| **Web** (`/web`) | Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · next-intl (ar/fr) · React Hook Form + Zod · Zustand · Three.js / react-three-fiber · jsPDF |
| **API** (`/api`) | Go · chi · pgx/v5 · golang-migrate (runs on boot) · JWT · bcrypt · `log/slog` |
| **Database** | PostgreSQL 16 (pgvector image) |
| **Infra** | Docker Compose · `mise` task runner |

No paid AI APIs — the fiche de fabrication is generated **deterministically**
(offline, no LLM, no embeddings).

---

## Repository layout

```
.
├── web/                  # Next.js frontend
├── api/                  # Go backend (Dockerfile + cmd/server, cmd/seed, cmd/seed-kb)
├── docker-compose.yml    # Postgres (pgvector) + API
├── mise.toml             # dev task runner
└── .env.example          # all config keys
```

---

## Quick start (Docker)

Runs the API + database together; migrations apply automatically on boot.

```bash
cp .env.example .env
docker compose up -d --build
curl localhost:8080/api/v1/health      # {"status":"ok","db":"ok"}

# demo data (one-off)
docker compose run --rm api /app/seed
docker compose run --rm api /app/seed-kb /app/kb-seed/zirconia_crown.json

# frontend
cd web && npm install && npm run dev    # http://localhost:3000
```

Open `http://localhost:3000` → it loads in **Arabic**. Click **ابدأ الآن**
(Get Started) to enter the app with a demo session; use the **FR / ع** toggle to
switch language.

**Demo accounts** (created by the seed, password `password123`):
`demo.dentist@dentalflow.tn` · `demo.lab@dentalflow.tn`

## Local dev (without Docker for the API)

Uses [mise](https://mise.jdx.dev) (installs Go + Node, wraps the tasks):

```bash
cp .env.example .env
mise install
mise run up          # start Postgres only
mise run api         # Go API → :8080
mise run web         # Next.js → :3000
mise run seed        # demo data
```
`mise tasks` lists everything. Raw equivalents live in [CLAUDE.md](CLAUDE.md) §9.

---

## Configuration

All config comes from environment variables — see [.env.example](.env.example).
Locally, `.env` is gitignored. Inside Docker the API reaches Postgres at host
`postgres` (the compose service), not `localhost`.

## Verification

- **Web:** `npm run typecheck && npm run lint && npm run build`
- **API:** `go vet ./... && go build ./... && go test ./...`
- Or everything: `mise run check`

## Deployment

The API ships as a single static container (`api/Dockerfile`, embedded
migrations). Deploy it to any container host with a managed PostgreSQL 16
(pgvector-capable); the frontend deploys to Vercel or a second service. Set
`DATABASE_URL`, the `JWT_*` secrets, and `CORS_ALLOWED_ORIGINS` accordingly.

---

*DentalFlow · Tunisia · French + Arabic*
