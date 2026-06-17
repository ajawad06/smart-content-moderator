# AI Content Moderation Platform

A full-stack platform where users submit images for automated, AI-powered policy-compliance
screening across six moderation categories, with an appeals workflow, admin-configurable
enforcement policies, and a platform analytics dashboard.

> **Status:** Phase 3 — policy configuration. Scaffold (1) + JWT auth (2) + versioned, immutable
> moderation policy config with per-category enable/threshold/enforcement controls. Submissions,
> verdicts, appeals, and analytics are implemented in subsequent phases.

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React + TypeScript + Vite, Tailwind CSS, TanStack Query, React Router |
| Backend      | Node.js + Express + TypeScript, Mongoose |
| Database     | MongoDB |
| Auth         | JWT (role-based: `user` / `admin`) |
| AI moderation | Pluggable provider — `mock` (no key) or `claude` (Anthropic vision) |
| Packaging    | Docker + docker-compose |

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

The frontend's status panel should show **API: reachable** and **Database: connected**.

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
| `MODERATION_PROVIDER` | `mock` | `mock` or `claude` |
| `ANTHROPIC_API_KEY` | — | Required only when provider is `claude` |
| `ANTHROPIC_MODEL` | `claude-opus-4-8` | Vision model used by the `claude` provider |
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

## Architecture notes

- **REST API is the only interface to the database.** The frontend never talks to MongoDB
  directly — every read/write goes through the Express API.
- **Pluggable AI moderation.** A provider interface lets the platform run fully offline with a
  deterministic `mock` classifier (so `docker-compose up` works with no API key), and switch to a
  real Claude vision model by setting `MODERATION_PROVIDER=claude` + `ANTHROPIC_API_KEY`.
- **Immutable verdicts (planned).** Each submission will snapshot the active policy configuration
  version, so later policy edits never retroactively change past verdicts.

## Health check

`GET /api/health` returns process uptime, MongoDB connection state, and the active moderation
provider — used by the frontend status panel to reflect real system state.
