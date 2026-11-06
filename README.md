# TalentIQ: Recruiter Panel (HireFlow AI)

This is the **website** of TalentIQ, an AI tool that reads CVs and ranks candidates for a job.

With it, a recruiter can:

1. **Create a job** with its requirements, for example "3 years of experience", "Node.js (mandatory)" or "React (preferred)".
2. **Upload CVs** (PDF or Word, up to 15 at a time).
3. **Let the AI read every CV** and score how well each candidate matches the job.
4. **See a ranked list** of candidates, open each one, and see which requirements they meet.

> **This website does not work on its own.** It needs the backend (the server, database and AI worker).
> The steps below start **everything together with one command**.

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

You should now have this layout. The folder names must be **exactly** these:

```
TalentIQ/
├── TalentIQ-backend/
└── TalentIQ-recruiter_panel/
```

### Step 4: Add the settings file

You received a file called **`.env`** separately (by email or chat). Put it inside the **`TalentIQ-backend`** folder.

> This website does **not** need its own `.env` file when you run it with Docker.

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

---

## Something isn't working?

| Problem | What to do |
|---|---|
| `docker: command not found` or "cannot connect to the Docker daemon" | Docker Desktop is not open. Open it, wait until it's running, then try again. |
| "port is already allocated" / "address already in use" | Another program uses the same port. Close it, or add `WEB_HOST_PORT=3001` (website) or `API_HOST_PORT=4001` (server) to the `.env` file, and run Step 5 again. The project needs ports 3000, 4000, 5433, 6379, 5672, 8080 and 15672. |
| The website doesn't open | Wait 1–2 minutes after starting, then refresh. Run `docker compose ps`: every line should say `running` or `healthy`. |
| "unable to prepare context" / "path not found" during Step 5 | The folders are not named exactly `TalentIQ-backend` and `TalentIQ-recruiter_panel`, or they are not next to each other. |
| No verification email arrives | Check your spam folder. You can also find the code in the logs: `docker compose logs api`. |
| A CV stays at "Failed" | The file may be a scanned image, password-protected or damaged. The reason is shown next to it. Try another file. |
| CVs stay at "Queued" | Run `docker compose logs worker` to see why. Usually the AI key in `.env` is missing or has reached its limit. |

---

## Extra tools (optional)

| Tool | Address | Login |
|---|---|---|
| Website | http://localhost:3000 | your own account |
| Database viewer (Adminer) | http://localhost:8080 | System **PostgreSQL**, Server `postgres`, User `postgres`, Password `postgres`, Database `talentiq` |
| Queue dashboard (RabbitMQ) | http://localhost:15672 | `talentiq` / `talentiq` |

---

## For developers

### Tech stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Bootstrap 5** + Bootstrap Icons for styling (Tailwind is loaded but used sparingly)
- **react-hook-form** + **zod** for forms, **zustand** for client state, **axios** for HTTP

### How it talks to the backend

The browser never calls the backend directly. It calls this app's own `/api/...` routes (`src/app/api`),
which forward the request to the backend with the user's token. The token is kept in an **httpOnly cookie**,
so JavaScript in the page can't read it.

```
Browser  →  Next.js /api/* (this app)  →  Backend API /api/v1/*
```

### Run without Docker (for development)

Requirements: **Node.js 22+**, and the backend running on `http://localhost:4000` (see the backend README).

1. Create a `.env` file in this folder:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_BASE_URL=http://localhost:4000/api/v1
   ```
2. Install and start:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000.

Don't run this and the Docker `web` service at the same time: both use port 3000.

### Settings

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Address of this website (baked in at build time) |
| `NEXT_BASE_URL` | Backend API address, used on the server only. In Docker this is `http://api:4000/api/v1` |
| `COOKIE_SECURE` | `true` / `false`. Whether the login cookie needs HTTPS. Defaults to `true` in production; Docker sets `false` because it runs on plain `http://localhost` |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run build` | Production build (standalone output, used by Docker) |
| `npm start` | Run the production build |
| `npm run lint` | Check the code with ESLint |

### Docker

- `Dockerfile` builds a small production image using Next.js `output: "standalone"`.
- The `web` service that runs it is defined in **`../TalentIQ-backend/docker-compose.yml`**, so one command starts the whole system.

### Pages

| Page | Address |
|---|---|
| Login / Register / Forgot password | `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| Dashboard (overview and top candidates) | `/dashboard` |
| Jobs list / Create job / Edit job | `/jobs`, `/jobs/create`, `/jobs/:id/edit` |
| Job details (upload CVs, candidate ranking) | `/jobs/:id` |
| Candidate evaluation (AI verdict per requirement) | `/candidates/:id` |

### Project structure

```
src/
├── app/          Pages (one folder per URL) and /api routes that forward to the backend
├── containers/   Full page components (Dashboard, Jobs, JobForm, JobDetails, CandidateEvaluation, Auth…)
├── core/comman/  Shared layout pieces (Sidebar, Header, Footer, badges, MatchScore…)
├── components/   Small shared components
├── services/     Functions that call the API (jobs, candidates, auth)
├── lib/          HTTP clients, auth cookie helpers
├── data/         Shared types and labels (Job, Candidate, verdicts, score bands)
├── utils/        Scoring, breadcrumbs, helpers
├── constants/    Navigation items, routes
└── proxy.ts      Redirects visitors who are not logged in to the login page
```
