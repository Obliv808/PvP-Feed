# WoW PvP Feed

A high-performance, automated World of Warcraft PvP intelligence aggregator. It monitors RSS feeds from **Wowhead**, **MMO-Champion**, and **Icy Veins**, scrapes linked article pages for embedded PvP changes and class tuning, isolates the relevant patch notes, and caches them for instantaneous browsing.

---

## Key Features

- **Multi-Source Aggregation**: Fetches and unifies news feeds from Wowhead, MMO-Champion, and Icy Veins.
- **Deep Section Scraping**: Automatically follows links for broad patch notes and hotfix articles to extract dedicated *Player versus Player* sub-sections.
- **Zero-Token Local Gatekeeper**: Evaluates incoming articles with a fast, keyword and section-density rule engine with zero API costs.
- **Optional AI Classifier**: Supports opt-in OpenAI integration (`gpt-4o-mini`) for edge-case NLP classification if desired.
- **PvP Excerpt Callouts**: Highlights the exact PvP changes directly on the card so players don't have to scroll through pages of PvE raid and dungeon notes.
- **PvP Topic & Class Filters**: Filter by PvP topic (*Class Tuning & Balance*, *Solo Shuffle & Arenas*, *Battlegrounds & Blitz*, *Seasons & Gear*, *AWC & Tournaments*) or quick-filter by any of the 13 World of Warcraft classes with signature class colors.
- **Instant Client Search**: Search dynamically by spell, ability, class, or keyword.
- **Persistent Local Cache**: Saves articles and synchronization timestamps in `data/pvp-feed.json` for instant, resilient page loads.
- **Automated 30-Minute Synchronization**: Next.js server instrumentation runs a background cron job every 30 minutes, with support for Vercel Cron and manual triggers.

---

## Architecture Overview

```
[ Wowhead / MMO-Champion / Icy Veins ]
                 │ (RSS Feeds)
                 ▼
          [ RSS Parser ]
                 │
        Candidate Filter (Hotfixes, Tuning, PvP)
                 │
                 ▼
        [ Deep Web Scraper ] ─── Fetches full article HTML (bypasses bot challenges)
                 │
                 ▼
        [ PvP Filter & Extractor ]
           ├─ Extract "Player versus Player" sections & excerpts
           ├─ Rule-based positive/negative classification
           └─ (Optional) OpenAI GPT fallback
                 │
                 ▼
       [ Cache: data/pvp-feed.json ]
                 │
        ┌────────┴────────┐
        ▼                 ▼
[ Web UI Dashboard ]  [ API: /api/feed ]
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 20+ / TypeScript 5.7
- **Styling**: Tailwind CSS v4
- **RSS & Parsing**: `rss-parser`
- **Scheduler**: `node-cron` & Next.js `instrumentation.ts`

---

## Project Structure

```
├── data/
│   └── pvp-feed.json          # Cached articles, timestamps, and deduplication IDs
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── feed/route.ts  # GET /api/feed - public JSON feed of cached articles
│   │   │   └── sync/route.ts  # GET/POST /api/sync - trigger manual/cron synchronization
│   │   ├── globals.css        # Tailwind styling and custom themes
│   │   ├── layout.tsx         # Root layout and font configurations
│   │   └── page.tsx           # Server component delivering initial cached feed
│   ├── components/
│   │   ├── ArticleCard.tsx    # Article card with highlighted PvP change excerpts
│   │   ├── FeedDashboard.tsx  # Interactive search, source filtering, and manual sync UI
│   │   └── SourceBadge.tsx    # Branded color badges for Wowhead, MMO-C, and Icy Veins
│   ├── lib/
│   │   ├── cron.ts            # 30-minute background cron runner
│   │   ├── pvp-filter.ts      # Zero-token classifier and PvP excerpt parser
│   │   ├── rss.ts             # RSS feed fetcher and deep HTML page scraper
│   │   ├── run-sync.ts        # Standalone CLI synchronization runner
│   │   ├── store.ts           # Filesystem JSON cache read/write logic
│   │   ├── sync.ts            # Core sync pipeline and deduplication logic
│   │   └── types.ts           # Data models and interfaces
│   └── instrumentation.ts     # Next.js server hook initializing the cron worker
├── .env.example               # Example environment configuration
├── vercel.json                # Vercel Cron configuration (every 30m)
└── package.json               # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd wow-pvp-feed
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CRON_SECRET` | No | *None* | Optional bearer token required to invoke `/api/sync` when deployed. |
| `USE_AI_FILTER` | No | `false` | Set to `"true"` to enable OpenAI classification alongside the local filter. |
| `OPENAI_API_KEY` | No | *None* | API key used if `USE_AI_FILTER=true`. |
| `OPENAI_MODEL` | No | `gpt-4o-mini`| Model name used for AI classification. |

---

## Available Scripts

- **`npm run dev`**: Starts the Next.js development server on `http://localhost:3000`.
- **`npm run build`**: Compiles the Next.js application for production.
- **`npm run start`**: Runs the compiled production server.
- **`npm run lint`**: Runs ESLint checks across the codebase.
- **`npm run sync`**: Executes a one-time feed fetch and deep scrape directly from the command line.

---

## API Endpoints

### 1. `GET /api/feed`
Returns the currently cached PvP articles without executing any external network requests.

**Response**:
```json
{
  "lastSync": "2026-09-07T05:21:39.074Z",
  "lastError": null,
  "articles": [
    {
      "id": "https://www.wowhead.com/news/...::title",
      "title": "Ula'tek Changes and Class Fixes - Patch 12.1 Hotfixes",
      "link": "https://www.wowhead.com/news/378415/...",
      "pubDate": "2026-09-02T18:30:00.000Z",
      "source": "Wowhead",
      "summary": "Player versus Player Druid Balance Fixed an issue where Faerie Swarm...",
      "pvpExcerpt": "Player versus Player Druid Balance Fixed an issue where Faerie Swarm was not a large debuff..."
    }
  ]
}
```

### 2. `GET` or `POST /api/sync`
Triggers an immediate fetch, deep scrape, and filter cycle.

**Authentication**:
If `CRON_SECRET` is set in your environment, pass the header:
```http
Authorization: Bearer <CRON_SECRET>
```

---

## Deployment

### Vercel
The repository includes a `vercel.json` file configuring a cron trigger hitting `/api/sync` every 30 minutes (`*/30 * * * *`). Set `CRON_SECRET` in your Vercel Project Settings to secure the endpoint.

### Container / Self-Hosted
When running as a long-running Node.js process (e.g. Docker or Cloud Run), `src/instrumentation.ts` automatically boots the internal `node-cron` schedule on server startup without requiring external webhook runners.
