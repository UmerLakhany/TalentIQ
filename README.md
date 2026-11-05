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

`201 Created`:
```json
{
  "success": true,
  "message": "Recruiter registered successfully.",
  "data": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "expires_in": "7d",
    "user": { "id": "<uuid>", "full_name": "Jane Recruiter", "email": "jane@company.com", "role": "recruiter", "last_login_at": null }
  }
}
```
Errors: `400` validation / malformed JSON, `409` email already registered.

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
