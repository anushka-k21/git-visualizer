# GitScope

A full-stack Git repository analytics and visualization platform that enables developers to import repositories, analyze commit history, explore branches, inspect file evolution, compare branches, replay repository growth, and discover repository insights through interactive visualizations.

---

## Overview

GitScope transforms raw Git data into interactive visual analytics.

The platform imports repositories, synchronizes Git history, stores metadata in PostgreSQL, and provides multiple views for understanding repository evolution and contributor activity.

Key capabilities include:

* Repository management and synchronization
* Interactive commit graph visualization
* Branch visualization and comparison
* Timeline-based repository exploration
* Contributor analytics and repository insights
* File evolution tracking
* Commit diff inspection
* Repository playback and historical replay
* Commit impact analysis

---

## Tech Stack

| Layer               | Technology                   |
| ------------------- | ---------------------------- |
| Frontend            | React 18, TypeScript, Vite   |
| UI                  | Tailwind CSS                 |
| State Management    | React Query                  |
| HTTP Client         | Axios                        |
| Graph Visualization | React Flow                   |
| Charts & Analytics  | Recharts                     |
| Backend             | Node.js, Express, TypeScript |
| Database            | PostgreSQL                   |
| ORM                 | Prisma                       |
| Git Operations      | simple-git                   |

---

## Features

### Repository Management

* Import Git repositories using URL
* Clone repositories locally
* Repository metadata storage
* Repository search and filtering
* Repository deletion
* Repository synchronization

### Commit Visualization

* Interactive commit graph
* Branch visualization
* Merge commit highlighting
* Commit details panel
* Commit filtering
* Zoom and pan support
* Commit focus and navigation

### Repository Timeline

* Day, week, and month grouping
* Chronological repository exploration
* Timeline-to-graph navigation
* Commit activity tracking

### Contributor Analytics

* Contributor aggregation
* Top contributor rankings
* Contributor activity charts
* Contribution heatmaps
* Repository statistics
* Contributor detail pages

### File Analysis

* Repository file explorer
* File search
* File commit history
* File evolution tracking
* File-to-commit navigation

### Diff Viewer

* Commit diff inspection
* Unified diff mode
* Split diff mode
* File-level change statistics
* Added, modified, deleted, and renamed file support

### Branch Comparison

* Branch comparison interface
* Ahead/behind analysis
* Merge base detection
* Unique commit identification
* Aggregate branch diffs
* Comparison graph highlighting

### Repository Playback

* Historical repository replay
* Timeline scrubber
* Playback controls
* Adjustable playback speed
* Graph animation over time

### Commit Impact Analysis

* Impact score calculation
* Impact rankings
* Repository impact dashboard
* Impact visualizations
* Commit significance metrics
* Graph node scaling based on impact

### Repository Workspace

Each repository is accessed through a dedicated workspace containing:

* Graph
* Timeline
* Files
* Insights
* Compare
* Playback
* Impact

Repository context is shared across all views through a unified navigation system.

---

## Project Structure

```text
gitscope/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   │
│   ├── public/
│   └── vite.config.ts
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── git/
│   │   │   ├── graph/
│   │   │   ├── analytics/
│   │   │   ├── playback/
│   │   │   ├── compare/
│   │   │   ├── impact/
│   │   │   └── files/
│   │   │
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── types/
│   │   └── server.ts
│   │
│   └── repositories/
│
├── package.json
└── README.md
```

---

## Prerequisites

* Node.js 18+
* PostgreSQL 14+
* Git installed and available on PATH

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd gitscope
```

### Create Database

```sql
CREATE DATABASE gitscope;
```

### Configure Environment

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gitscope?schema=public"
PORT=3001
NODE_ENV=development
REPOSITORIES_PATH="./repositories"
FRONTEND_URL="http://localhost:5173"
```

### Install Dependencies

```bash
npm install
npm run install:all
```

### Generate Prisma Client

```bash
cd backend

npx prisma generate
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start Development Servers

From project root:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3001
```

---

## Environment Variables

### Backend

| Variable          | Description                  |
| ----------------- | ---------------------------- |
| DATABASE_URL      | PostgreSQL connection string |
| PORT              | Backend server port          |
| NODE_ENV          | Environment                  |
| REPOSITORIES_PATH | Local repository storage     |
| FRONTEND_URL      | Allowed frontend origin      |

---

## Database Tables

The application uses the following primary tables:

### repositories

Stores repository metadata.

### commits

Stores synchronized commit history.

### branches

Stores repository branches and branch metadata.

### contributors

Stores contributor aggregates and contributor statistics.

### _prisma_migrations

Managed automatically by Prisma for migration tracking.

---

## Main Application Routes

### General Routes

| Route         | Description                 |
| ------------- | --------------------------- |
| /             | Repository import dashboard |
| /repositories | Repository listing          |

### Repository Workspace Routes

| Route                      | Description            |
| -------------------------- | ---------------------- |
| /repositories/:id/graph    | Commit graph           |
| /repositories/:id/timeline | Repository timeline    |
| /repositories/:id/files    | File explorer          |
| /repositories/:id/insights | Repository analytics   |
| /repositories/:id/compare  | Branch comparison      |
| /repositories/:id/playback | Repository playback    |
| /repositories/:id/impact   | Commit impact analysis |

---

## API Overview

### Repository APIs

```http
POST   /api/repositories/import
GET    /api/repositories
GET    /api/repositories/:id
DELETE /api/repositories/:id
POST   /api/repositories/:id/sync
```

### Commit APIs

```http
GET /api/repositories/:id/commits
GET /api/repositories/:id/graph
GET /api/commits/:hash
GET /api/commits/:hash/diff
```

### Branch APIs

```http
POST /api/repositories/:id/sync-branches
GET  /api/repositories/:id/branches
GET  /api/repositories/:id/compare
GET  /api/repositories/:id/compare/diff
```

### Timeline APIs

```http
GET /api/repositories/:id/timeline
```

### Analytics APIs

```http
GET /api/repositories/:id/stats
GET /api/repositories/:id/contributors
GET /api/repositories/:id/contributors/:contributorId
GET /api/repositories/:id/heatmap
```

### File APIs

```http
GET /api/repositories/:id/files
GET /api/repositories/:id/files/history
```

### Playback APIs

```http
GET /api/repositories/:id/playback
```

### Impact APIs

```http
GET /api/repositories/:id/impact
```

---

## Supported Repository URLs

```text
https://github.com/owner/repository

https://github.com/owner/repository.git

https://gitlab.com/owner/repository

https://bitbucket.org/owner/repository

git@github.com:owner/repository.git
```

---

## Development Notes

* Repository synchronization is idempotent.
* Existing commits are not duplicated.
* Large repositories may require several minutes to synchronize.
* Commit graph rendering uses React Flow.
* Analytics data is generated from synchronized Git history.
* Branch comparison and impact analysis operate on locally cloned repositories.

---

## Prisma Studio

To inspect the database:

```bash
cd backend

npx prisma studio
```

Default URL:

```text
http://localhost:5555
```

---

## License

This project is intended for educational, research, and portfolio purposes.
