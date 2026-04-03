# Personal Dashboard

A mobile-first dashboard that aggregates outputs from your [Claude Cowork](https://claude.ai) scheduled tasks into one place — accessible from anywhere on your phone.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fpersonal-dashboard&env=DASHBOARD_PASSCODE,API_KEY&envDescription=Set%20a%20passcode%20for%20viewing%20and%20an%20API%20key%20for%20Cowork%20pushes&project-name=my-personal-dashboard&stores=[{"type":"neon"}])

## What It Does

Cowork tasks push structured content (meal plans, grocery lists, daily briefs, workout schedules) to this dashboard via a simple REST API. You view everything in one scrollable feed on your phone.

## Setup (~5 minutes)

### 1. Deploy to Vercel

Click the **Deploy** button above. You'll be prompted to:
- Connect your GitHub account
- Set two environment variables (see below)
- Vercel will automatically create and connect a Neon Postgres database

### 2. Set Environment Variables

In the Vercel deployment screen, set:

| Variable | What to set |
|---|---|
| `DASHBOARD_PASSCODE` | A passcode you'll use to log in (anything you like) |
| `API_KEY` | A random secret your Cowork tasks will use to push data. Generate one with: `openssl rand -hex 32` |

### 3. Connect Your Cowork Tasks

See [COWORK-INTEGRATION.md](./COWORK-INTEGRATION.md) for copy-paste instructions for each widget type.

## Running Locally

```bash
git clone https://github.com/YOUR_USERNAME/personal-dashboard
cd personal-dashboard
npm install
cp .env.local.example .env.local
# Edit .env.local with your values and a local Neon DATABASE_URL
npm run dev
```

## Widget Types

| Type | Use for |
|---|---|
| `html` | Rich formatted content (meal plans, reports) |
| `markdown` | Text-based content (daily briefs, summaries) |
| `checklist` | Interactive lists (grocery lists, to-dos) |
