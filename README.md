# Middle East Job Aggregator

A Next.js web application that scrapes and aggregates job listings from multiple Middle East job portals in real time. Browse opportunities across 10 countries, filter by category, and export results — all from a single interface.

---

## Features

- **Live job scraping** — Fetches listings on demand from 11+ sources including LinkedIn, Talent.com, Jooble, GrabJobs, OpenSooq, GulfTalent, Gulf News, and more
- **10 countries covered** — Jordan, Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, Oman, Iraq, Lebanon, and Egypt
- **37 job categories** — From tradespeople (carpenter, plumber, electrician) to household services (cleaner, driver, cook) and more
- **AI categorization** — Uses OpenAI to classify jobs that don't match standard categories
- **Smart caching** — Avoids redundant scrapes; shows cache age and lets users force a live refresh
- **Advanced filtering** — Filter by keyword, country, category, source, and date posted
- **Export** — Download results as CSV or Excel
- **Statistics & market intelligence** — Charts for jobs by country, category, source, city, salary ranges, and demand ranking
- **Interactive map** — Visualize job locations across the region
- **Source health monitoring** — Automatic pause/resume for sources that fail repeatedly
- **Dark mode** — Full light/dark theme support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Data fetching | TanStack Query |
| Scraping | Cheerio + native fetch |
| Charts | Recharts |
| Map | React Leaflet |
| Animations | Framer Motion |
| AI | OpenAI API |
| Export | ExcelJS + PapaParse |
| Validation | Zod |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) — `npm install -g pnpm`

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
pnpm install
```

### Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `RAPIDAPI_KEY` | RapidAPI key for JSearch (free tier: 200 req/month) | Optional |
| `OPENAI_API_KEY` | OpenAI API key for AI-based job categorization | Optional |

> Get a free RapidAPI key at [rapidapi.com](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)

### Running Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with feature overview |
| `/jobs` | Browse and search jobs by country |
| `/stats` | Charts and market intelligence dashboard |
| `/map` | Geographic map of job listings |
| `/sources` | Data source list with live health status |

---

## API Routes

| Endpoint | Description |
|---|---|
| `GET /api/scrape` | Triggers a live scrape for a given country |
| `GET /api/stats` | Returns aggregated statistics |
| `GET /api/sources/health` | Returns health status per source per country |
| `GET /api/export` | Streams a CSV/Excel export of current results |

---

## Data Sources

| Source | Countries |
|---|---|
| LinkedIn Jobs | All 10 countries |
| Talent.com | All 10 countries |
| Jooble | All 10 countries |
| GrabJobs | All 10 countries |
| OpenSooq | Jordan, Saudi Arabia, UAE |
| Gulf News Classifieds | UAE |
| GulfTalent | Saudi Arabia |
| Jobrapido | Saudi Arabia |
| Learn4Good | Saudi Arabia |

> Some sources (NaukriGulf, Expatriates) are listed but currently disabled due to runtime fetch limitations.

---

## Source Health System

Sources are monitored automatically per country. If a source returns zero results or fails repeatedly, it is **auto-paused** for a cooldown period and retried later. Health states:

- **Healthy** — Running normally
- **Monitoring** — Recent instability detected
- **Auto-paused** — Temporarily disabled, will retry after cooldown
- **Inactive** — Manually disabled

---

## Deployment

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push your repo to GitHub
2. Import the project on Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy

For other platforms, build the app first:

```bash
pnpm build
pnpm start
```

---

## Disclaimer

This tool aggregates publicly available job listings from third-party websites for informational purposes only. All job data, trademarks, and content belong to their respective owners. Users should verify listings directly on the source websites before applying. Please respect each site's terms of service and `robots.txt` directives.
