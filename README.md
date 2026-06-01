# Git Visualizer

A web application for visualizing Git repositories. Phase 1 covers import and management. Phase 2–3 add commit parsing, sync, and an interactive commit graph.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query, Axios, React Flow |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Git | simple-git |

---

## Project Structure

```
git-visualizer/
├── frontend/
│   └── src/
│       ├── components/       # ImportForm, RepositoryCard, Navbar
│       ├── pages/            # Dashboard.tsx, RepositoryPage.tsx
│       ├── services/         # api.ts (Axios instance + repository API)
│       ├── hooks/            # useRepositories.ts (React Query hooks)
│       ├── types/            # index.ts (shared TypeScript types)
│       ├── utils/            # index.ts (date formatting, URL parsing)
│       └── App.tsx
│
└── backend/
    └── src/
        ├── controllers/      # repositoryController.ts
        ├── services/
        │   └── git/          # gitService.ts (simple-git clone)
        ├── services/         # repositoryService.ts (business logic)
        ├── routes/           # repositoryRoutes.ts
        ├── middleware/       # errorHandler.ts, requestLogger.ts
        ├── utils/            # prisma.ts, gitUrlParser.ts
        ├── types/            # index.ts
        ├── prisma/
        │   └── schema.prisma
        └── server.ts
```

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **Git** (installed and on PATH)

---

## Setup Instructions

### 1. Clone this project

```bash
git clone <this-repo-url>
cd git-visualizer
```

### 2. Set up PostgreSQL

Create a database:

```sql
CREATE DATABASE git_visualizer;
```

### 3. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/git_visualizer?schema=public"
PORT=3001
NODE_ENV=development
REPOSITORIES_PATH="./repositories"
FRONTEND_URL="http://localhost:5173"
```

### 4. Install dependencies

```bash
# From project root
npm install          # installs concurrently
npm run install:all  # installs frontend + backend deps
```

Or manually:

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 5. Generate Prisma client & run migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

This creates the `repositories` and `commits` tables in PostgreSQL.

### 6. Start development servers

From the **project root**:

```bash
npm run dev
```

Or start separately:

```bash
# Terminal 1 — backend on :3001
npm run dev:backend

# Terminal 2 — frontend on :5173
npm run dev:frontend
```

Open **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string (required) |
| `PORT` | `3001` | Express server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `REPOSITORIES_PATH` | `./repositories` | Where cloned repos are stored |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

---

## Database Schema

```prisma
model Repository {
  id        String   @id @default(uuid())
  name      String
  owner     String
  url       String   @unique
  localPath String
  createdAt DateTime @default(now())
  commits   Commit[]
}

model Commit {
  id           String   @id @default(uuid())
  hash         String
  parentHashes String[]
  author       String
  email        String
  message      String
  commitDate   DateTime
  repositoryId String
  createdAt    DateTime @default(now())

  @@unique([repositoryId, hash])
}
```

---

## API Documentation

### Base URL: `http://localhost:3001/api`

---

### `POST /repositories/import`

Import a Git repository by URL.

**Request body:**

```json
{
  "url": "https://github.com/facebook/react"
}
```

**Success response** `201`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "react",
    "owner": "facebook",
    "url": "https://github.com/facebook/react",
    "localPath": "/abs/path/to/repositories/facebook__react",
    "createdAt": "2024-03-01T12:00:00.000Z"
  },
  "message": "Repository \"facebook/react\" imported successfully."
}
```

**Error responses:**

| Status | Reason |
|---|---|
| `400` | Missing or invalid URL |
| `409` | Repository already imported |
| `422` | Git clone failed (private repo, bad URL, etc.) |
| `500` | Internal server error |

---

### `GET /repositories`

List all imported repositories (newest first).

**Success response** `200`:

```json
{
  "success": true,
  "data": [ /* Repository[] */ ]
}
```

---

### `GET /repositories/:id`

Get a single repository by ID.

**Success response** `200`:

```json
{
  "success": true,
  "data": { /* Repository */ }
}
```

---

### `DELETE /repositories/:id`

Delete a repository (removes database record, all commits, and local clone).

**Success response** `200`:

```json
{
  "success": true,
  "message": "Repository deleted successfully."
}
```

---

### `POST /repositories/:id/sync`

Parse commit history from the local clone and store commits in the database. Shallow Phase 1 clones are unshallowed automatically before parsing.

**Success response** `200`:

```json
{
  "success": true,
  "data": {
    "repositoryId": "uuid",
    "commitsParsed": 1523,
    "commitsStored": 1523
  }
}
```

Re-running sync is idempotent (`commitsStored` may be `0` if all commits already exist).

---

### `GET /repositories/:id/commits`

List stored commits (newest first).

**Success response** `200`:

```json
{
  "success": true,
  "data": [
    {
      "hash": "abc123...",
      "author": "Jane Doe",
      "message": "Fix bug",
      "commitDate": "2025-01-15T10:00:00.000Z",
      "parents": ["def456..."]
    }
  ]
}
```

---

### `GET /repositories/:id/graph`

Return commit graph nodes (with layout positions) and edges for visualization.

**Success response** `200`:

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "abc123",
        "position": { "x": 0, "y": 0 },
        "data": {
          "hash": "abc123",
          "author": "Jane",
          "message": "Initial commit",
          "commitDate": "2025-01-15T10:00:00.000Z",
          "isMerge": false
        }
      }
    ],
    "edges": [
      { "id": "parent-child", "source": "parent", "target": "child" }
    ]
  }
}
```

---

### `GET /commits/:hash?repositoryId=`

Detailed commit info including file stats from Git (`git diff-tree --numstat`).

---

### `POST /repositories/:id/sync-branches`

Refresh branch list from local clone.

---

### `GET /repositories/:id/branches`

List branches with commit counts per branch.

---

### `GET /repositories/:id/timeline?groupBy=day|week|month`

Chronological commit groups for timeline view.

---

### `GET /health`

Health check endpoint.

```json
{ "status": "ok", "timestamp": "..." }
```

---

## Supported URL Formats

```
https://github.com/owner/repo
https://github.com/owner/repo.git
https://gitlab.com/owner/repo
https://bitbucket.org/owner/repo
git@github.com:owner/repo.git
```

---

## Features

### Phase 1

- [x] Repository import via URL (POST /repositories/import)
- [x] Git clone via simple-git (full history)
- [x] Metadata storage in PostgreSQL via Prisma
- [x] Import page with loading / success / error states
- [x] Repository listing page with search
- [x] Delete repositories (DB + local clone)
- [x] Full TypeScript (frontend + backend)
- [x] Proper error handling with descriptive messages
- [x] React Query for server state management

### Phase 2–3

- [x] Commit model and parsing engine (POST /repositories/:id/sync)
- [x] List commits (GET /repositories/:id/commits)
- [x] Graph layout service (GET /repositories/:id/graph)
- [x] Unshallow support for legacy shallow clones on sync
- [x] React Flow commit graph UI at `/repositories/:id/graph`
- [x] Pan, zoom, fit view, and commit node selection

### Phase 4–5

- [x] Commit details panel (GET /commits/:hash)
- [x] Branch model, sync, and sidebar filtering
- [x] Branch head labels and merge commit styling on graph
- [x] Timeline page with day/week/month grouping
- [x] Timeline → graph navigation with commit focus
- [x] Backend unit tests (`npm test` in `backend/`)

### Workflow

1. Import a repository from the dashboard.
2. Open **Repositories** → **Graph**.
3. Click **Sync commits**, then **Sync branches** in the sidebar.
4. Select commits for details; filter by branch; use **Timeline** for chronological browse.

Large repositories (10k+ commits) may take several minutes to sync.

### Database migration (Phase 4)

```bash
cd backend
npx prisma migrate dev
```

---

## Prisma Studio (optional)

Browse your database visually:

```bash
cd backend && npx prisma studio
```

Opens at **http://localhost:5555**
