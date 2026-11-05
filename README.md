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
