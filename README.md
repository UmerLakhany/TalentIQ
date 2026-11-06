# TalentIQ: Backend (Server, Database & AI)

TalentIQ is an AI tool that **reads CVs and ranks candidates** for a job. A recruiter creates a job with its
requirements, uploads CVs (PDF or Word), and the AI scores how well each candidate matches.

This folder is the **"engine"** of the project. It contains:

- the **server (API)** that the website talks to,
- the **database** that stores accounts, jobs and candidates,
- the **AI worker** that reads each CV and scores it.

It also starts the **website** (the recruiter panel, from the `TalentIQ-recruiter_panel` folder), so
**one command starts the whole project**.

---

## How to run the project (step by step)

You **don't need any programming knowledge**. You only need to install one program (Docker) and copy-paste a few commands.

### Step 1: Install Docker Desktop

1. Download it from **https://www.docker.com/products/docker-desktop/** and install it.
2. **Open Docker Desktop** and wait until it says it is running (a green status in the bottom-left corner).
3. Leave Docker Desktop open while you use the project.

> On Windows, Docker may ask to install or update **WSL**. Accept, and restart the computer if it asks.

### Step 2: Install Git (to download the project)

Download it from **https://git-scm.com/downloads** and install it with the default options.

> **Don't want to install Git?** On the GitHub page, switch to each branch (`backend` and `recruiter_panel`),
> click **Code → Download ZIP**, unzip both, and rename the folders as shown in Step 3.

### Step 3: Download both parts of the project

Open a terminal:
- **Windows:** press the Start button, type **PowerShell**, and open it.
- **Mac:** open **Terminal**.

Copy and paste these commands one at a time, pressing **Enter** after each:

```powershell
mkdir TalentIQ
cd TalentIQ
git clone -b backend https://github.com/UmerLakhany/TalentIQ.git TalentIQ-backend
git clone -b recruiter_panel https://github.com/UmerLakhany/TalentIQ.git TalentIQ-recruiter_panel
```

You should now have this layout. The folder names must be **exactly** these, side by side:

```
TalentIQ/
├── TalentIQ-backend/            ← this folder
└── TalentIQ-recruiter_panel/    ← the website
```

### Step 4: Add the settings file

You received a file called **`.env`** separately (by email or chat). Put it inside the **`TalentIQ-backend`** folder.
It contains the AI key, email settings and other configuration. **Never upload it to GitHub or share it publicly.**

> **Can't see the file?** Files starting with a dot are hidden. On Windows, open File Explorer and turn on
> **View → Show → Hidden items**. Make sure the name is exactly `.env`, not `.env.txt` or `env`.

### Step 5: Start everything

In the same terminal, paste:

```powershell
cd TalentIQ-backend
docker compose up -d --build
```

- The **first time takes about 5–10 minutes**, because it downloads and builds everything. Later starts take a few seconds.
- It is finished when you see the terminal prompt again, with lines like `Container talentiq-web Started`.

This starts 7 parts: the website, the server, the AI worker, the database (PostgreSQL), a cache (Redis),
a task queue (RabbitMQ) and a database viewer (Adminer).

### Step 6: Open the website

Go to **http://localhost:3000** in your browser (Chrome, Edge or Firefox).

1. Click **Register** and create an account.
2. A **6-digit code** is sent to your email. Enter it to verify your account.
3. Create a job, upload some CVs, and wait a few seconds for the AI scores to appear.

---

## Everyday commands

Run these inside the **`TalentIQ-backend`** folder (`cd TalentIQ-backend`).

| I want to… | Command |
|---|---|
| **Start** the project | `docker compose up -d` |
| **Stop** the project | `docker compose down` |
| **Check** that everything is running | `docker compose ps` |
| **See logs or errors** | `docker compose logs -f api worker web` (press `Ctrl + C` to exit) |
| **Delete all data** (accounts, jobs, CVs) and start fresh | `docker compose down -v` then `docker compose up -d` |
| **Rebuild** after downloading new code | `docker compose up -d --build` |

Stopping keeps your data. Only `down -v` deletes it, and that can't be undone.

### Clear only the database (keep everything running)

```powershell
docker exec -it talentiq-postgres psql -U postgres -d talentiq -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose restart api worker
```

The server creates the empty tables again when it restarts.

---

## Something isn't working?

| Problem | What to do |
|---|---|
| `docker: command not found` or "cannot connect to the Docker daemon" | Docker Desktop is not open. Open it, wait until it's running, then try again. |
| "port is already allocated" / "address already in use" | Another program uses the same port. Close it, or add `WEB_HOST_PORT=3001` (website), `API_HOST_PORT=4001` (server) or `POSTGRES_HOST_PORT=5434` (database) to the `.env` file, and run Step 5 again. The project needs ports 3000, 4000, 5433, 6379, 5672, 8080 and 15672. |
| The website doesn't open | Wait 1–2 minutes after starting, then refresh. Run `docker compose ps`: every line should say `running` or `healthy`. |
| "unable to prepare context" / "path not found" during Step 5 | The folders are not named exactly `TalentIQ-backend` and `TalentIQ-recruiter_panel`, or they are not next to each other. |
| No verification email arrives | Check your spam folder. You can also find the code in the logs: `docker compose logs api`. |
| A CV stays at "Failed" | The file may be a scanned image, password-protected or damaged. The reason is shown next to it. Try another file. |
| CVs stay at "Queued" | Run `docker compose logs worker` to see why. Usually the AI key (`GEMINI_API_KEY`) in `.env` is missing or has reached its limit. |

---

## Addresses

| What | Address | Login |
|---|---|---|
| **Website** | http://localhost:3000 | your own account |
| Server (API) | http://localhost:4000/api/v1 (health check: `/api/v1/_health`) | — |
| Database viewer (Adminer) | http://localhost:8080 | System **PostgreSQL**, Server `postgres`, User `postgres`, Password `postgres`, Database `talentiq` |
| Queue dashboard (RabbitMQ) | http://localhost:15672 | `talentiq` / `talentiq` |

---

# For developers

Express + TypeScript + Sequelize (PostgreSQL) API, a RabbitMQ-driven CV analysis worker using Google Gemini,
and Redis for caching and one-time codes.

## How it fits together

```
Browser ─► Recruiter panel (Next.js, :3000) ─► API (Express, :4000) ─► PostgreSQL
                                                   │    └──────────► Redis (cache, OTP codes)
                                                   ▼
                                       RabbitMQ queue "cv_processing"
                                                   ▼
                                       Worker ─► Gemini AI ─► saves score to PostgreSQL
```

Uploaded CVs are stored in the `uploads` Docker volume, shared by the API and the worker.

## Settings (`.env`)

The most important values:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | AI key (free at https://aistudio.google.com/apikey). **Required** for CV scoring |
| `JWT_SECRET` | Secret used to sign login tokens. **Required** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email account used to send verification and reset codes. If empty, emails are printed in the API logs instead |
| `POSTGRES_HOST_PORT`, `API_HOST_PORT`, `WEB_HOST_PORT` | Ports on your computer (default 5432, 4000, 3000) |
| `CV_MAX_FILES`, `CV_MAX_FILE_SIZE_MB` | Upload limits (default 15 files, 5 MB each) |
| `WORKER_CONCURRENCY` | How many CVs the worker analyses at the same time |

In Docker, `docker-compose.yml` overrides the database, Redis and RabbitMQ addresses so the services find each other.

## Local development (API and worker with npm)

Requirements: **Node.js 22+** and Docker.

1. `npm install`
2. Start only the infrastructure: `docker compose up -d postgres redis rabbitmq adminer`
   (if PostgreSQL is installed locally on 5432, set `POSTGRES_HOST_PORT=5433` and use that port in `DB_URL`).
3. Make sure `.env` exists in this folder, with `localhost` addresses for `DB_URL`, `REDIS_URL` and `RABBITMQ_URL`.
4. In two terminals: `npm run dev` (API, auto-reload) and `npm run worker` (CV worker).
5. Run the recruiter panel with `npm run dev` in `../TalentIQ-recruiter_panel` (see its README).

Tables are created from the models when the API starts (`DB_SYNC_ALTER=true`).
Don't run the Docker `api` / `web` services and the `npm run dev` servers at the same time: they use the same ports.

## Scripts
- `npm run dev` — API with ts-node + nodemon
- `npm run worker` — CV analysis worker with ts-node + nodemon
- `npm run build` — compile to `dist/`
- `npm start` / `npm run worker:prod` — run the compiled API / worker
- `npm run typecheck` — type-check without emitting

## Response format
- Success: `{ "success": true, "message": "...", "data": { ... } }`
- Error: `{ "success": false, "statusCode": 400, "message": "...", "errors": ["..."] }`

## Endpoints

### POST /api/v1/recruiter/auth/register
```json
{ "full_name": "Jane Recruiter", "email": "jane@company.com", "password": "Secret123" }
```
Rules: `full_name` 2–100 chars, valid `email`, `password` 8–72 chars with an uppercase letter, a lowercase letter, a number and a special character (`_ ~ = @ # $ > . < , [ { } ( ) ! % | ' " ` : ; + * ? &`).
Unknown fields (e.g. `role`) are ignored; new accounts always get the `recruiter` role.

`201 Created` (a verification code is emailed; no token until the email is verified):
```json
{
  "success": true,
  "message": "Registration successful. A verification code has been sent to your email.",
  "data": { "email": "jane@company.com", "email_sent": true, "otp_expires_in_minutes": 10 }
}
```
Errors: `400` validation / malformed JSON, `409` email already registered.


### Email verification (OTP)
Registering emails a 6-digit code (nodemailer). Codes are stored hashed in Redis, expire after
`OTP_EXPIRY` minutes, allow `OTP_MAX_ATTEMPTS` wrong tries, and can be re-sent after `OTP_RESEND_COOLDOWN`
seconds. Login is refused (`403`) until the email is verified. If SMTP is not configured (development),
emails are printed to the server console instead of sent.

**POST /api/v1/recruiter/auth/verify-email**: `{ "email": "jane@company.com", "otp": "123456" }`
`200` returns the same `data` as login (the recruiter is signed in). Errors: `400` invalid / expired code or
too many attempts, `409` already verified.

**POST /api/v1/recruiter/auth/resend-otp**: `{ "email": "jane@company.com" }`
Errors: `404` no account, `409` already verified, `429` cooldown not over, `502` email could not be sent.

### Forgot password (3 steps)
1. **POST /api/v1/recruiter/auth/forgot-password**: `{ "email": "jane@company.com" }`
   Emails a 6-digit reset code. Always returns `200` with the same message, whether or not the email is
   registered. `429` if a code was requested in the last `OTP_RESEND_COOLDOWN` seconds.
2. **POST /api/v1/recruiter/auth/verify-reset-otp**: `{ "email": "jane@company.com", "otp": "123456" }`
   Returns `{ "reset_token": "...", "expires_in_minutes": 15 }`. Same code rules as email verification.
3. **POST /api/v1/recruiter/auth/reset-password**:
   `{ "reset_token": "...", "new_password": "NewPass123", "confirm_password": "NewPass123" }`
   Sets the password (same rules as registration), marks the email verified, and emails a
   "password changed" notice. The token works once and expires after `PASSWORD_RESET_TOKEN_EXPIRY` minutes.
   Errors: `400` passwords don't match / weak password / invalid or expired token.

### POST /api/v1/recruiter/auth/login
Also served at `POST /api/v1/auth/login`, the path the recruiter panel calls.
```json
{ "email": "jane@company.com", "password": "Secret123", "remember_me": false }
```
`remember_me` is optional: `true` issues a 30-day token, otherwise the token lasts `JWT_EXPIRY`.
`200 OK` returns the same `data` shape as register (`access_token`, `token_type`, `expires_in`, `user`)
and updates `last_login_at`.
Errors: `400` validation, `401` wrong email or password (same message for both), `403` account deactivated.

### Authentication for protected routes
Send `Authorization: Bearer <access_token>` (from login or verify-email). Missing, invalid or expired
tokens, and tokens of deleted / deactivated / unverified accounts get `401`.

### POST /api/v1/recruiter/jobs  (protected)
Also served at `POST /api/v1/jobs`, the path the recruiter panel uses. Body mirrors the panel's job form:
```json
{
  "title": "Full-Stack Developer",
  "description": "Build and scale our recruitment platform end-to-end.",
  "minExperience": 3,
  "experienceType": "mandatory",
  "skills": [
    { "name": "Node.js", "type": "mandatory" },
    { "name": "React.js or Next.js", "type": "preferred" },
    { "name": "Python", "type": "not_required" }
  ],
  "education": { "name": "Bachelor's degree in Computer Science", "type": "preferred" },
  "otherRequirements": [{ "name": "Experience building scalable applications", "type": "preferred" }]
}
```
Rules: `title` 3–150 chars; `description` ≤ 500; `minExperience` whole number 0–40; `experienceType`,
`education.type`, `otherRequirements[].type` are `mandatory` | `preferred`; `skills` 1–50 items with type
`mandatory` | `preferred` | `not_required`, no duplicate names; `education` and `otherRequirements` optional.

`201 Created` returns the job with its requirements as a flat list (experience, skills, education, other):
`{ id, title, description, minExperience, requirements: [{ id, category, name, type }], createdAt }`.
An experience requirement is generated when `minExperience > 0`.

### GET /api/v1/recruiter/jobs  (protected)
Lists the logged-in recruiter's jobs. Query (all optional): `page` (default 1), `limit` (default 10, max 100),
`search` (title contains, case-insensitive), `sort` = `newest` (default) | `oldest` | `title_asc` | `title_desc`.
Returns `{ jobs: [...], pagination: { page, limit, total, totalPages } }`.

### GET /api/v1/recruiter/jobs/:id  (protected)
Returns one job. `404` if it doesn't exist or belongs to another recruiter.

### PUT /api/v1/recruiter/jobs/:id  (protected)
Full update: same body and rules as create (plus optional `reanalyze` boolean). The requirement list is
replaced. Returns the updated job. `404` as above.

### DELETE /api/v1/recruiter/jobs/:id  (protected)
Deletes the job and its requirements. Returns `{ id }`. `404` as above.

### POST /api/v1/recruiter/jobs/:id/cvs  (protected, multipart/form-data)
Upload CVs for a job in the form-data field **`files`** (repeat the field per file).
Up to `CV_MAX_FILES` (15) files per request, each ≤ `CV_MAX_FILE_SIZE_MB` (5 MB), PDF or DOCX only.

For each valid file the API stores it at `UPLOAD_DIR/cvs/<jobId>/<uuid>.<ext>`, creates a candidate with
status `queued`, and publishes `{ candidateId, jobId, queuedAt }` to the RabbitMQ queue `cv_processing`
(persistent message, publisher-confirmed). Files are checked by content (PDF must start with `%PDF`,
DOCX must be a ZIP), not only by extension.

Unsupported files are skipped and listed in `rejected`; the rest are still accepted. `201` response:
`{ jobId, uploaded, queued, candidates: [{ id, jobId, fileName, fileType, fileSizeKb, cvUrl, status, uploadedAt, matchScore }], rejected: [{ fileName, reason }] }`.
Errors: `400` no valid files / too many files / file too large / wrong field name / not form-data,
`401` not logged in, `404` job not found or not yours. A CV that can't be queued is saved with status `failed`.

Deleting a job also deletes its candidates and their uploaded files.

All job routes are also served under `/api/v1/jobs`.

### GET /api/v1/recruiter/jobs/:id/candidates  (protected)
All CVs of a job plus a progress summary. Query (optional): `sort` = `score` (default) | `name` |
`experience` | `uploaded`; `status` = `queued` | `processing` | `completed` | `failed`.
Analysed candidates come first, then processing, queued and failed. `rank` is the position by match score
among analysed candidates (1 = best), or null.
Returns `{ job: { id, title }, summary: { totalCvs, analyzed, queued, processing, inProgress, failed, averageScore, topScore, mandatory, preferred }, candidates: [...] }`.

Each candidate: `{ id, jobId, fileName, fileType, fileSizeKb, cvUrl, status, errorMessage?, uploadedAt, processedAt, matchScore, rank, profile?, evaluation? }`
(`profile` / `evaluation` match `CandidateProfile` / `CandidateEvaluation` in the recruiter panel).

### GET /api/v1/recruiter/candidates/:id  (protected)
One candidate with `rank` and its `job` (including requirements, to label the per-requirement verdicts).
`404` if it doesn't exist or belongs to another recruiter's job.

### GET /api/v1/recruiter/candidates/:id/cv
The original file, shown in the browser; add `&download=1` to download it with the original name.
Access: the signed `?token=` already included in `cvUrl` (valid `CV_URL_EXPIRY_MINUTES`, only for that CV),
or an `Authorization: Bearer` header.

### POST /api/v1/recruiter/candidates/:id/retry  (protected)
Re-queues a `failed` CV (clears previous results). `409` if the CV is not failed or the file is missing.

### DELETE /api/v1/recruiter/candidates/:id  (protected)
Deletes the candidate and its file.

All candidate routes are also served under `/api/v1/candidates`.

### GET /api/v1/recruiter/dashboard  (protected)
Everything the Dashboard page shows, for the logged-in recruiter's jobs only (also at `/api/v1/dashboard`):
`stats` (jobs, cvs, analyzed, averageScore, inProgress, failed, allMandatoryMet), `topCandidates` (top 5 by score
across all jobs, with mandatory requirements met), `scoreDistribution` (Strong 85+, Good 70–84, Partial 50–69,
Low 0–49), `processing` (queued / processing / completed / failed), `jobs` (per-job counts, average and best
candidate) and `needsAttention` (latest failed CVs with the reason).

### Re-analysis after editing a job
`PUT /jobs/:id` compares the new criteria with the old ones. Requirements with the same category and name
keep their id. If anything the AI uses changed (title, description, minimum experience, or a requirement added,
removed or re-typed) and `reanalyze` is `true` (default), every CV of the job is queued again; the response
contains `reanalysis: { criteriaChanged, requeued, rescored }`. With `reanalyze: false` existing verdicts are
kept and scores are recalculated from them. Each re-queue increases the candidate's `analysisVersion`, and the
worker discards outdated messages and results, so an analysis that was running during the edit can't overwrite
the new one.

### Caching (Redis)
- `GET /jobs/:id/candidates` caches the job's candidate list + summary (`CACHE_TTL_CANDIDATES`, default 300s);
  sorting and filtering are applied to the cached list, and signed `cvUrl` links are generated per request.
- `GET /dashboard` caches the recruiter's dashboard (`CACHE_TTL_DASHBOARD`, default 120s).
- Caches are cleared immediately when a CV is uploaded, starts / finishes / fails analysis (by the worker),
  is retried or deleted, and when a job is created, edited or deleted.
- Responses include `X-Cache: HIT` or `MISS`. If Redis is unavailable the API reads from PostgreSQL.

Redis also stores OTP codes and password-reset tokens (with automatic expiry).

## CV analysis worker
A separate process that consumes the RabbitMQ queue `cv_processing` and analyses each CV with an LLM:

```sh
npm run worker        # development (auto-reload)
npm run worker:prod   # compiled (after npm run build)
```

Per CV: status `processing` → extract text (pdf-parse / mammoth) → send the CV text and the job's
requirements to the LLM → validate the JSON reply → calculate the match score → save `profile`,
`evaluation`, `matchScore`, status `completed`. Unreadable files (scanned images, password-protected,
corrupted) and AI errors that persist after retries set status `failed` with a readable `errorMessage`.

- **Scoring** (same as the recruiter panel's `utils/scoring.ts`): mandatory requirements 70%, preferred 30%
  (a group with no requirements gives its weight to the other); `met` = 1, `partial` = 0.5,
  `not_met` / `not_found` = 0; `not_required` requirements are ignored.
- **Reliability**: messages are acknowledged only after the result is saved, so CVs survive a worker crash;
  a CV is attempted at most `CV_MAX_ATTEMPTS` times. Rate limits / overloads are retried with backoff
  (15s, 30s, 60s) and the next model in `GEMINI_FALLBACK_MODELS` is tried immediately.
- **Concurrency**: `WORKER_CONCURRENCY` CVs at a time per worker; run more workers to scale.
- **LLM**: `LLM_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `LLM_TIMEOUT_MS`.
  Other providers can be added in `src/lib/ai/providers`.

### GET /api/v1/_health
Health check.

## Project structure
- `settings/` — database URL and Sequelize instance
- `src/routes/v1/` — route definitions (`recruiter/auth.ts`, ...)
- `src/dto/` — request validation (class-validator DTOs + `validateDTO` middleware)
- `src/services/` — request handlers / business logic
- `src/repositories/` — database access
- `src/models/` — Sequelize models
- `src/middlewares/` — response helpers (`res.generalResponse` / `res.generalError`) and error handler
