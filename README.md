# DentalFlow

A web platform connecting dental labs (prothésistes) with dentists (dentistes) in
Tunisia — replacing WhatsApp, phone calls, and paper slips with a structured digital
case workflow.

> **Source of truth:** [CLAUDE.md](CLAUDE.md). Read it before writing any code.

## Stack

- **Web** (`/web`) — Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **API** (`/api`) — Go 1.22+ + chi + pgx/v5
- **Database** — PostgreSQL 16

UI language is French (Arabic/RTL is post-MVP).

## Repository layout

```
.
├── web/                 # Next.js frontend
├── api/                 # Go backend
├── docker-compose.yml   # Local infra (Postgres)
├── .env.example         # Environment template
└── CLAUDE.md            # Project spec / source of truth
```

## Prerequisites

- [Docker](https://www.docker.com/) + Docker Compose
- [Node.js](https://nodejs.org/) 18+ (for `web/`)
- [Go](https://go.dev/) 1.22+ (for `api/`)

## Getting started

The fastest path is [mise](https://mise.jdx.dev) (installs Go/Node and runs the tasks):

```bash
cp .env.example .env     # one-time
mise install             # install pinned Go + Node
mise run setup           # start Postgres + sync Go deps + install web deps
mise run seed            # optional: demo lab/dentist/cases

# then, in two terminals:
mise run api             # Go API  → http://localhost:8080
mise run web             # Next.js → http://localhost:3000
```

`mise tasks` lists everything. Common ones:

| Task | What it does |
|------|--------------|
| `mise run up` / `down` / `reset-db` | start / stop / wipe Postgres |
| `mise run api` | run the Go API (migrations apply on boot) |
| `mise run web` | run the Next.js dev server |
| `mise run seed` | insert demo data |
| `mise run check` | all backend + frontend checks (vet/build/test + typecheck/lint/build) |
| `mise run api-tidy` / `api-fmt` | `go mod tidy` / `gofmt -w` |

<details>
<summary>Without mise (raw commands)</summary>

```bash
cp .env.example .env
docker compose up -d                         # Postgres (down / down -v to stop / wipe)
cd api && go run ./cmd/server                # API  → :8080
cd web && npm install && npm run dev         # Web  → :3000
```
</details>

## Verification gates

Before marking any task done (see [CLAUDE.md](CLAUDE.md) §9) — `mise run check`, or manually:

- **Web:** `npm run typecheck && npm run lint && npm run build` all pass
- **API:** `go vet ./... && go build ./... && go test ./...` all pass

## Environment

All configuration comes from environment variables — see [.env.example](.env.example)
for the full list of keys. Never commit your `.env`.
