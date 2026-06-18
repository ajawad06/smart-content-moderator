# AI Content Moderation Platform

A full-stack platform where users submit images for automated, AI-powered policy-compliance
screening across six moderation categories, with an appeals workflow, admin-configurable
enforcement policies, and a platform analytics dashboard.

> **Status:** Phase 8 — frontend complete. Full REST API (1–7) plus a React SPA covering auth,
> image submission, filtered history, submission detail with per-category breakdown, the appeal
> flow, and the admin policy editor / appeals queue / analytics dashboard. Final step is the
> end-to-end Docker rebuild.

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React + TypeScript + Vite, Tailwind CSS, TanStack Query, React Router |
| Backend      | Node.js + Express + TypeScript, Mongoose |
| Database     | MongoDB |
| Auth         | JWT (role-based: `user` / `admin`) |
| AI moderation | Pluggable provider — `mock` (no key) or `groq` (Llama 4 vision) |
| Packaging    | Docker + docker-compose |

## Frontend

A React SPA ([`frontend/src`](frontend/src)) built with Vite, Tailwind, TanStack Query, and React Router:

- **Auth** — register / login, JWT persisted to `localStorage`, session restored via `/auth/me`, role-aware nav, protected + admin-only routes.
- **Submit** — multi-image upload with previews and inline per-image verdict results.
- **History** — filterable, paginated table (outcome / category / date) with appeal status shown inline.
- **Submission detail** — image (fetched with auth as a blob), full per-category breakdown, and the file/track-appeal flow.
- **My appeals** — track status and admin responses.
- **Admin** — policy editor (per-category enable/threshold/enforcement, saves a new version only when changed), appeals queue (accept/reject with response), and the analytics dashboard (stat cards + dependency-free bar charts).

## Project structure

```
.
├── backend/            # Express REST API (sole interface to MongoDB)
│   └── src/
│       ├── config/     # env validation (zod)
│       ├── db/         # Mongoose connection
│       ├── middleware/ # error handling (more later)
│       └── utils/      # logger
├── frontend/           # React SPA (Vite dev server / nginx in prod)
│   └── src/
├── docker-compose.yml  # mongo + backend + frontend
└── .env.example        # root env for compose
```

## Quick start (Docker — recommended)

Requires Docker + Docker Compose.

```bash
cp .env.example .env        # optional: adjust secrets / AI provider
docker-compose up --build
```

Then open:

- Frontend: http://localhost:8080
- API health: http://localhost:4000/api/health

### Demo accounts

- **Admin** — `admin@acm.local` / `admin12345` (seeded automatically on first startup). Use this to access the policy editor, appeals queue, and analytics dashboard. Override via `ADMIN_EMAIL` / `ADMIN_PASSWORD` for a real deployment.
- **User** — click **Create one** on the login screen to self-register and test the submission/appeal flows.

## Local development (without Docker)

You need a local MongoDB on `mongodb://localhost:27017` (or point `MONGO_URI` elsewhere).

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173  (proxies /api to :4000)
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime mode |
| `PORT` | `4000` | API port |
| `MONGO_URI` | `mongodb://localhost:27017/acm` | MongoDB connection string |
| `JWT_SECRET` | — (required, min 16 chars) | Token signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CORS_ORIGIN` | `*` | Allowed origins (comma-separated or `*`) |
| `MODERATION_PROVIDER` | `mock` | `mock` or `groq` |
| `GROQ_API_KEY` | — | Required only when provider is `groq` (free at console.groq.com) |
| `GROQ_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | Vision model used by the `groq` provider |
| `ADMIN_EMAIL` | `admin@acm.local` | Seeded admin account email |
| `ADMIN_PASSWORD` | `admin12345` | Seeded admin account password |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PROXY_TARGET` | `http://localhost:4000` | Dev-server proxy target for `/api` |

## API

All endpoints are under `/api`. Auth uses a JWT bearer token: `Authorization: Bearer <token>`.

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | — | Create a user account; returns `{ token, user }` |
| `POST` | `/login` | — | Authenticate; returns `{ token, user }` |
| `GET`  | `/me` | Bearer | Return the current user |

A seeded admin account is created on first startup (default `admin@acm.local` / `admin12345`,
configurable via `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Passwords are bcrypt-hashed and never returned
by the API.

### Policies (`/api/policies`)

Moderation policy is **versioned and immutable**: each admin change creates a new version; the
active policy is the highest version. Existing verdicts reference the version active when they were
created, so policy edits never apply retroactively.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`   | `/active` | Bearer | The currently active policy version |
| `GET`   | `/catalog` | Bearer | Category catalog (keys, labels, descriptions) |
| `GET`   | `/` | Admin | Full version history (newest first) |
| `GET`   | `/:version` | Bearer | A specific policy version |
| `PATCH` | `/` | Admin | Apply per-category changes → creates a new version |

Each category setting has `enabled` (disabled categories are skipped during screening), `threshold`
(0–100%, detections below are inconclusive), and `enforcement` (`auto_block` or `flag_for_review`).
A default version 1 (all categories enabled, threshold 70, flag-for-review) is seeded on startup.

### Submissions (`/api/submissions`)

All require a bearer token. Each uploaded image is screened independently and gets its own verdict; the submission records an aggregate outcome (most severe across images) and snapshots the active policy version.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | `multipart/form-data` with 1–10 images under the `images` field (≤5 MB each, JPEG/PNG/GIF/WebP). Screens each, returns the submission + verdicts |
| `GET`  | `/` | Current user's history. Filters: `outcome`, `category`, `from`, `to` (ISO dates); pagination via `page`, `limit` |
| `GET`  | `/:id` | A submission with its per-image verdicts (category breakdowns). Owner or admin only |
| `GET`  | `/:id/verdicts/:verdictId/image` | Raw image bytes. Owner or admin only |

Submission `GET` responses include an `appeal` field (the appeal for that submission, or `null`) so the history can show appeal status directly.

### Appeals (`/api/appeals`)

A user may appeal a submission whose outcome is **Flagged** or **Blocked** (one appeal per submission, with a written justification). Appeals enter a pending queue visible only to admins. On **accept**, every non-approved verdict in the submission is overridden to Approved and the submission outcome becomes Approved (the original per-verdict outcome is preserved for audit). On **reject**, nothing changes.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST`  | `/` | Bearer | File an appeal `{ submissionId, justification }` |
| `GET`   | `/mine` | Bearer | The current user's appeals (filters: `status`, `page`, `limit`) |
| `GET`   | `/` | Admin | Review queue / all appeals (`status=pending` for the queue) |
| `PATCH` | `/:id` | Admin | Resolve: `{ decision: "accept" \| "reject", response? }` |

### Analytics (`/api/analytics`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | Platform-wide dashboard data (single payload) |

Computed with MongoDB aggregation pipelines, the payload includes: `overview` totals; `submissionsOverTime` (daily volume); `submissionsByOutcome` and `verdictsByOutcome` (effective outcome — override wins); `verdictsByCategory` (violation detections per category); `appeals` (volume + resolution/acceptance rates + accepted/rejected breakdown); and `topUsersBySubmissions` / `topUsersByViolations` leaderboards.

## AI moderation

Moderation runs behind a provider interface ([`ModerationProvider`](backend/src/modules/moderation/provider.types.ts)) with two implementations, selected by `MODERATION_PROVIDER`:

- **`mock`** (default) — deterministic, dependency-free classifier. The same image always yields the same result, so `docker-compose up` works with no API key. Most images come back clean; a deterministic minority are flagged. As a demo aid, a filename containing a category keyword (e.g. `violence.jpg`) forces a high-confidence detection.
- **`groq`** — uses a Groq-hosted vision model (Llama 4, default `meta-llama/llama-4-scout-17b-16e-instruct`) via the Groq API with JSON-mode output. Requires `GROQ_API_KEY` (free tier at [console.groq.com](https://console.groq.com)).

Providers only **classify** (confidence 0–100 + reasoning per category). A pure [verdict engine](backend/src/modules/moderation/verdict.ts) then applies the active policy: disabled categories are skipped, a detection counts only if `confidence >= threshold` (else inconclusive), and **Auto-Block > Flag-for-Review > Approved**. The engine also records the policy version it ran against, so verdicts can snapshot it.

## Architecture notes

- **REST API is the only interface to the database.** The frontend never talks to MongoDB
  directly — every read/write goes through the Express API.
- **Pluggable AI moderation.** A provider interface lets the platform run fully offline with a
  deterministic `mock` classifier (so `docker-compose up` works with no API key), and switch to a
  real Groq-hosted vision model by setting `MODERATION_PROVIDER=groq` + `GROQ_API_KEY`.
- **Immutable verdicts (planned).** Each submission will snapshot the active policy configuration
  version, so later policy edits never retroactively change past verdicts.

## Health check

`GET /api/health` returns process uptime, MongoDB connection state, and the active moderation
provider — used by the frontend status panel to reflect real system state.
