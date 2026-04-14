# CodeOvertake

A unified coding leaderboard for NSUT students. Tracks and ranks profiles across **GitHub**, **LeetCode**, **Codeforces**, and **CodeChef** — scores update daily from live platform data.

## Features

- **Multi-Platform Scoring** — Aggregates stats from 4 platforms into a single score (max 4000)
- **Live Leaderboard** — Overall, year-wise, and branch-wise rankings with search, filters, and infinite scroll
- **Platform Leaderboards** — Dedicated tabs with platform-specific stats (repos, stars, problems solved, ratings, etc.)
- **Student Profiles** — Detailed breakdown, platform links, DiceBear avatars, score history chart, profile completeness
- **Top Gainers** — Daily spotlight on students climbing the fastest
- **Real-Time Validation** — Username validation with live preview cards during registration
- **Automated Updates** — Cron job fetches fresh data daily with per-platform rate-limit-aware concurrency
- **History Tracking** — Daily snapshots for trend analysis
- **CSV Seeding** — Bulk import students from CSV with GitHub username extraction
- **About Page** — Transparent scoring formulas and ranking system explained

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Frontend | React, React Router, TypeScript, Vite |
| Styling | Tailwind CSS, JetBrains Mono + Archivo fonts |
| Charts | Recharts |
| Icons | Lucide React |
| Avatars | DiceBear API |
| Scheduling | node-cron |

## Project Structure

```
codeovertake/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/
│   │   ├── Student.js            # Student schema (profiles, stats, scores, ranks)
│   │   └── Snapshot.js           # Daily score snapshots
│   ├── platforms/
│   │   ├── github.js             # GitHub REST + GraphQL API
│   │   ├── leetcode.js           # LeetCode GraphQL (unofficial)
│   │   ├── codeforces.js         # Codeforces official API
│   │   ├── codechef.js           # CodeChef web scraping
│   │   └── index.js              # Platform registry
│   ├── services/
│   │   ├── studentService.js     # Registration, lookup, username updates
│   │   ├── leaderboardService.js # Leaderboard queries, top gainers
│   │   └── rankingService.js     # Overall/year/branch ranking calculation
│   ├── controllers/              # Route handlers
│   ├── routes/                   # Express routes
│   ├── middlewares/              # Error handling, validation, async wrapper
│   ├── cron/updateData.js        # Parallel batch data fetcher
│   ├── scripts/
│   │   ├── seedFromCSV.js        # Bulk import students from CSV
│   │   └── runUpdate.js          # Manual data refresh trigger
│   ├── server.js                 # Express server entry
│   └── .env.example
└── frontend/
    └── src/
        ├── main.tsx              # App entry
        └── app/
            ├── api.ts            # API client functions
            ├── routes.tsx        # React Router config
            └── components/
                ├── Layout.tsx    # Navbar + footer shell
                ├── Leaderboard.tsx # Main leaderboard with tabs, filters, infinite scroll
                ├── Register.tsx  # Two-step registration with validation
                ├── StudentProfile.tsx # Full student profile page
                ├── About.tsx     # About + scoring + contact page
                └── PlatformIcons.tsx # SVG platform icons
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas/Cosmos)
- pnpm (frontend)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and GitHub token
npm install
npm run dev
```

Runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Runs on `http://localhost:5173`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `GITHUB_TOKEN` | GitHub PAT (for contributions data + higher rate limits) | Recommended |
| `CRON_SCHEDULE` | Cron expression for data updates | No (default: 12 AM IST) |
| `FRONTEND_URL` | CORS allowed origin | No (default: http://localhost:3000) |
| `NSUT_API_URL` | External API for student lookup by roll number | No |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/search?q=` | Search students by name/roll number |
| GET | `/api/students/lookup/:rollno` | Lookup student details |
| POST | `/api/students/register` | Register a new student |
| GET | `/api/students/:rollno` | Get full student profile |
| PUT | `/api/students/:rollno/usernames` | Update platform usernames |
| POST | `/api/students/:rollno/restore` | Restore previous usernames |
| GET | `/api/students/:rollno/history` | Get score history snapshots |
| GET | `/api/students/validate-username/:platform/:username` | Validate platform username |
| GET | `/api/students/branches` | Get available branches |
| GET | `/api/leaderboard` | Combined leaderboard (paginated) |
| GET | `/api/leaderboard/:platform` | Platform-specific leaderboard |
| GET | `/api/leaderboard/filters` | Available filter options (years, branches) |
| GET | `/api/leaderboard/top-gainers` | Top score gainers between snapshots |
| POST | `/api/admin/update` | Manually trigger data refresh |

## Scoring System

Each platform contributes up to **1000 points** (max total: 4000). Exponential curves reward early effort; linear scaling for ratings.

| Platform | Component | Max | Type |
|----------|-----------|-----|------|
| **GitHub** | Contributions | 600 | Exponential |
| | Stars | 200 | Exponential |
| | Public Repos | 100 | Exponential |
| | Followers | 100 | Exponential |
| **LeetCode** | Weighted Solved (Easy×1 + Med×3 + Hard×6) | 700 | Exponential |
| | Contest Rating | 300 | Linear |
| **Codeforces** | Problems Solved | 500 | Exponential |
| | Current Rating | 400 | Linear |
| | Peak Rating | 100 | Linear |
| **CodeChef** | Problems Solved | 500 | Exponential |
| | Current Rating | 400 | Linear |
| | Highest Rating | 100 | Linear |

## Data Update Pipeline

The update system uses **per-platform parallel streams** with rate-limit-aware concurrency:

| Platform | Concurrency | Delay | Rate Limit |
|----------|-------------|-------|------------|
| GitHub | 15 workers | 0ms | 5000 req/hr (with token) |
| LeetCode | 5 workers | 200ms | ~20-30 req/min |
| Codeforces | 2 workers | 1000ms | ~1 req/2s |
| CodeChef | 3 workers | 500ms | Conservative (scraping) |

All platforms fetch simultaneously. Total time ≈ slowest platform, not the sum.

## Scripts

```bash
# Seed students from CSV
node backend/scripts/seedFromCSV.js

# Manually run data update + ranking calculation
node backend/scripts/runUpdate.js
```

## Built By

**Sujal Chaudhary** — NSUT, CSAI, Batch of 2028
- [Portfolio](https://sujal.info)
- [LinkedIn](https://sujal.info/linkedin)
- [GitHub](https://sujal.info/github)
