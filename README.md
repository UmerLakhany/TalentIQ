# TalentIQ Backend

Express + TypeScript + Sequelize (PostgreSQL) API for the TalentIQ AI-powered CV screening system.

## Setup

1. Install dependencies: `npm install`
2. Start infrastructure (PostgreSQL, Redis, RabbitMQ, Adminer): `docker compose up -d`
   - Adminer: http://localhost:8080 (server `postgres`, user `postgres`, password `postgres`, db `talentiq`)
   - RabbitMQ UI: http://localhost:15672 (`talentiq` / `talentiq`)
   - If PostgreSQL is already installed locally on 5432, either use it (create a `talentiq` database) or run
     `POSTGRES_HOST_PORT=5433 docker compose up -d` and change `DB_URL` accordingly.
3. Copy `.env.example` to `.env` and set `JWT_SECRET` and `DB_URL`.
4. Run in development (auto-reload): `npm run dev`

The API is served at `http://localhost:4000/api/v1`. Tables are created from the models on startup
(`DB_SYNC_ALTER=true`).

## Scripts
- `npm run dev` — run with ts-node + nodemon
- `npm run build` — compile to `dist/`
- `npm start` — run the compiled server
- `npm run typecheck` — type-check without emitting

## Response format
- Success: `{ "success": true, "message": "...", "data": { ... } }`
- Error: `{ "success": false, "statusCode": 400, "message": "...", "errors": ["..."] }`

## Endpoints

### POST /api/v1/recruiter/auth/register
```json
{ "full_name": "Jane Recruiter", "email": "jane@company.com", "password": "Secret123" }
```
Rules: `full_name` 2–100 chars, valid `email`, `password` 8–72 chars with at least one letter and one number.
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
