# AI Content Moderation Platform

A full-stack platform where users submit images for automated, AI-powered policy-compliance
screening across six violation categories. It produces structured per-image verdicts, supports a
fair appeal workflow, lets admins configure enforcement policy per category, and surfaces
platform-wide analytics — all behind a single REST API with role-based access.

## Live demo

|                    | URL                                                     |
| ------------------ | ------------------------------------------------------- |
| **App (frontend)** | https://smart-content-moderator.vercel.app/             |
| **API health**     | https://smart-content-moderator.onrender.com/api/health |

**Demo accounts**

- **Admin:** `admin@acm.local` / `admin12345` — full access (policy editor, appeals queue, analytics).
- **User:** click **Create one** on the login screen to self-register and test submissions/appeals.

> Hosted on free tiers (Vercel + Render + MongoDB Atlas). The backend **sleeps after ~15 min idle**,
> so the first request may take ~30–50s to wake — subsequent requests are fast.

## Features

**Users**

- Register / log in (JWT).
- Submit one or more images in a single request; each is screened independently.
- View full submission history with filters by **outcome**, **category**, and **date**.
- Inspect any submission's per-image verdict: per-category classification, confidence, and reasoning.
- File an appeal on a Flagged/Blocked submission and track its status (Pending / Accepted / Rejected).

**Admins** (everything above, plus)

- **Policy configuration** — per category: enable/disable, confidence threshold, and enforcement
  (Auto-Block or Flag for Review). Changes are **versioned and immutable**.
- **Appeals queue** — review pending appeals and accept (overrides the verdict to Approved) or reject.
- **Analytics dashboard** — submission volume over time, verdict distribution by outcome and
  category, appeal volume / resolution / acceptance rates, and user leaderboards.

## Moderation categories

Graphic Violence · Hate Symbols · Self-Harm · Extremist Propaganda · Weapons & Contraband ·
Harassment & Humiliation. Each active category yields a classification, a confidence score, and a
short reasoning string per image.

## Tech stack

| Layer         | Technology                                                            |
| ------------- | --------------------------------------------------------------------- |
| Frontend      | React + TypeScript + Vite, Tailwind CSS, TanStack Query, React Router |
| Backend       | Node.js + Express + TypeScript, Mongoose                              |
| Database      | MongoDB                                                               |
| Auth          | JWT, role-based (`user` / `admin`), bcrypt password hashing           |
| AI moderation | Pluggable provider — `mock` (no key) or `groq` (Llama 4 vision)       |
| Packaging     | Docker + Docker Compose                                               |
| Hosting       | Vercel (frontend) · Render (backend) · MongoDB Atlas                  |

## Architecture & key decisions

- **REST API is the only interface to the database.** The frontend never touches MongoDB directly —
  every read/write goes through the Express API.
- **Immutable, versioned policy.** Each admin change creates a _new_ policy version rather than
  mutating the current one; the active policy is the highest version. Submissions snapshot the
  version active at submission time, so editing policy never retroactively changes past verdicts.
- **AI classifies; policy decides.** Providers only return confidence + reasoning per category. A
  pure [verdict engine](backend/src/modules/moderation/verdict.ts) then applies the policy: disabled
  categories are skipped, a detection counts only if `confidence >= threshold` (else inconclusive),
  and **Auto-Block > Flag-for-Review > Approved**.
- **Pluggable AI moderation.** A provider interface lets the platform run fully offline with a
  deterministic `mock` classifier (so it works with no API key), or switch to a real Groq-hosted
  vision model via `MODERATION_PROVIDER=groq` + `GROQ_API_KEY`.
- **Appeals preserve an audit trail.** Accepting an appeal overrides verdicts to Approved while
  keeping each verdict's original outcome on record.

## Data model (MongoDB)

| Collection      | Purpose                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `users`         | Accounts with role (`user` / `admin`); bcrypt-hashed passwords.                                    |
| `policyconfigs` | Versioned policy; each version holds per-category `{ enabled, threshold, enforcement }`.           |
| `submissions`   | One per upload request: owner, snapshotted policy version, aggregate outcome, violated categories. |
| `verdicts`      | One per image: stored image, outcome + override, per-category breakdown, policy version, provider. |
| `appeals`       | One per submission: justification, status, admin response, resolver.                               |

## Project structure

```
.
├── backend/                  # Express REST API (sole interface to MongoDB)
│   └── src/
│       ├── config/           # env validation (zod)
│       ├── constants/        # moderation categories, outcomes, enforcement
│       ├── db/               # Mongoose connection + startup seeding
│       ├── middleware/       # auth (JWT/role), validation, error handling
│       ├── models/           # User, PolicyConfig, Submission, Verdict, Appeal
│       ├── modules/          # feature modules: auth, policies, moderation,
│       │                     #   submissions, appeals, analytics
│       └── utils/            # logger, jwt, asyncHandler
├── frontend/                 # React SPA (Vite dev server / nginx in prod)
│   └── src/
│       ├── auth/             # auth context
│       ├── components/       # UI primitives, layout, guards
│       ├── lib/              # API client, types, constants
│       └── pages/            # routes (+ pages/admin)
├── docker-compose.yml        # mongo + backend + frontend
├── render.yaml               # backend deploy blueprint (Render)
└── frontend/vercel.json      # frontend deploy config (Vercel)
```

## Quick start (Docker — recommended)

Requires Docker + Docker Compose. No API key needed — it runs with the `mock` provider by default.

```bash
docker compose up --build
```

Then open:

- **Frontend:** http://localhost:8080
- **API health:** http://localhost:4000/api/health

Log in with the demo admin (`admin@acm.local` / `admin12345`) or register a user.

To use real AI locally, create a root `.env` (see `.env.example`) with `MODERATION_PROVIDER=groq`
and a `GROQ_API_KEY` from [console.groq.com](https://console.groq.com).

## Local development (without Docker)

Requires a local MongoDB on `mongodb://localhost:27017` (or point `MONGO_URI` elsewhere).

```bash
# Backend  (terminal 1)
cd backend && cp .env.example .env && npm install && npm run dev   # http://localhost:4000

# Frontend (terminal 2)
cd frontend && npm install && npm run dev                          # http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so no extra config is needed.

## Environment variables

### Backend (`backend/.env`)

| Variable              | Default                                     | Description                               |
| --------------------- | ------------------------------------------- | ----------------------------------------- |
| `NODE_ENV`            | `development`                               | Runtime mode                              |
| `PORT`                | `4000`                                      | API port (Render injects its own)         |
| `MONGO_URI`           | `mongodb://localhost:27017/acm`             | MongoDB connection string                 |
| `JWT_SECRET`          | — (required, min 16 chars)                  | Token signing secret                      |
| `JWT_EXPIRES_IN`      | `7d`                                        | Token lifetime                            |
| `CORS_ORIGIN`         | `*`                                         | Allowed origins (comma-separated, or `*`) |
| `MODERATION_PROVIDER` | `mock`                                      | `mock` or `groq`                          |
| `GROQ_API_KEY`        | —                                           | Required only when provider is `groq`     |
| `GROQ_MODEL`          | `meta-llama/llama-4-scout-17b-16e-instruct` | Vision model for the `groq` provider      |
| `ADMIN_EMAIL`         | `admin@acm.local`                           | Seeded admin email                        |
| `ADMIN_PASSWORD`      | `admin12345`                                | Seeded admin password                     |

### Frontend (`frontend/.env`)

| Variable            | Default                 | Description                                                   |
| ------------------- | ----------------------- | ------------------------------------------------------------- |
| `VITE_PROXY_TARGET` | `http://localhost:4000` | Dev-server proxy target for `/api`                            |
| `VITE_API_URL`      | —                       | Absolute backend URL for split deploys (e.g. `https://…/api`) |

## API reference

All endpoints are under `/api`. Authenticated requests send `Authorization: Bearer <token>`.
Passwords are bcrypt-hashed and never returned.

### Auth (`/api/auth`)

| Method | Path        | Auth   | Description                              |
| ------ | ----------- | ------ | ---------------------------------------- |
| `POST` | `/register` | —      | Create a user; returns `{ token, user }` |
| `POST` | `/login`    | —      | Authenticate; returns `{ token, user }`  |
| `GET`  | `/me`       | Bearer | Current user                             |

### Policies (`/api/policies`)

Versioned & immutable — each change creates a new version; the active policy is the highest version.
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/active` | Bearer | Active policy version |
| `GET` | `/catalog` | Bearer | Category catalog (keys, labels, descriptions) |
| `GET` | `/` | Admin | Full version history |
| `GET` | `/:version` | Bearer | A specific version |
| `PATCH` | `/` | Admin | Apply per-category changes → new version |

### Submissions (`/api/submissions`)

| Method | Path                             | Auth        | Description                                                                      |
| ------ | -------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| `POST` | `/`                              | Bearer      | `multipart/form-data`, 1–10 images under `images` (≤5 MB, JPEG/PNG/GIF/WebP)     |
| `GET`  | `/`                              | Bearer      | History; filters `outcome`, `category`, `from`, `to`; pagination `page`, `limit` |
| `GET`  | `/:id`                           | Owner/Admin | Submission + per-image verdicts (+ appeal)                                       |
| `GET`  | `/:id/verdicts/:verdictId/image` | Owner/Admin | Raw image bytes                                                                  |

### Appeals (`/api/appeals`)

Appealable only when the submission is Flagged or Blocked (one appeal per submission). Acceptance
overrides the verdicts to Approved (originals preserved); rejection changes nothing.
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | Bearer | File `{ submissionId, justification }` |
| `GET` | `/mine` | Bearer | Current user's appeals (filters: `status`, `page`, `limit`) |
| `GET` | `/` | Admin | Queue / all appeals (`status=pending` for the queue) |
| `PATCH` | `/:id` | Admin | Resolve `{ decision: "accept" \| "reject", response? }` |

### Analytics (`/api/analytics`)

| Method | Path | Auth  | Description                                                                 |
| ------ | ---- | ----- | --------------------------------------------------------------------------- |
| `GET`  | `/`  | Admin | Platform dashboard data (single payload, via MongoDB aggregation pipelines) |

### Health (`/api/health`)

Returns process uptime, MongoDB connection state, and the active moderation provider.

## Deployment (Vercel + Render)

The frontend deploys to **Vercel** (static SPA), the backend to **Render** (Node web service), with
**MongoDB Atlas** as the database. Because the two live on different domains, the frontend calls the
backend's absolute URL via `VITE_API_URL`, and the backend allows the frontend origin via `CORS_ORIGIN`.

1. **MongoDB Atlas** — create a free cluster, add a DB user, allow network access (`0.0.0.0/0`), and
   copy the `mongodb+srv://…/acm` connection string.
2. **Render (backend)** — use [`render.yaml`](render.yaml) (New → Blueprint) or a Web Service with
   root `backend`, build `npm install && npm run build`, start `npm start`, health check
   `/api/health`. Set `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGIN`,
   `MODERATION_PROVIDER=groq`, `GROQ_API_KEY`. Render injects `PORT`.
3. **Vercel (frontend)** — import the repo, set **Root Directory = `frontend`**, and add
   `VITE_API_URL = https://<your-render-url>/api`. Deploy, then point Render's `CORS_ORIGIN` at the
   resulting Vercel URL (or leave `*`).
