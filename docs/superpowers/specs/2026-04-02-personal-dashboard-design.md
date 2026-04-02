# Personal Dashboard — Design Spec
**Date:** 2026-04-02
**Status:** Approved

---

## Overview

A mobile-first personal dashboard web app that aggregates outputs from Claude Cowork scheduled tasks into a single, accessible interface. Users configure their Cowork tasks to push structured content to the dashboard via a REST API; the dashboard stores and displays that content as widgets.

The project is designed to be shared as an open-source GitHub repository with a one-click Vercel deploy button, so that any Cowork user — technical or not — can run their own instance in minutes at no cost.

---

## Goals

- Aggregate outputs from any number of Cowork scheduled tasks into one place
- Accessible from anywhere, especially on mobile (phone)
- Flexible enough to support any content a Cowork task produces
- Simple enough for a non-technical user to self-deploy
- Zero ongoing hosting cost for the project author; each user bears only their own free-tier costs

---

## Non-Goals (v1)

- Multi-user accounts on a single deployment (one person per deployment)
- Real-time push / WebSocket updates
- Native mobile app (PWA-friendly web app is sufficient)
- Widget drag-and-drop reordering (position field reserved for future use)
- Complex retry/queueing logic for failed pushes

---

## Architecture

### Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend + API | Next.js (App Router) on Vercel | Single codebase for UI and API routes; ideal Vercel fit; free tier |
| Database | Vercel Neon Postgres | Built into Vercel dashboard; no separate account needed; free tier |
| Auth | Passcode (view) + API key (push) | No auth library needed; simple for non-technical users to configure |
| Styling | Tailwind CSS | Mobile-first utility classes; no extra dependencies |

### Deployment Model

Each user deploys their own independent instance:
1. Click "Deploy to Vercel" button in the GitHub README
2. Set three environment variables in the Vercel dashboard
3. Add the push snippet to each Cowork task's instructions

No shared server. No accounts. Each person owns their data entirely.

### Environment Variables

| Variable | Purpose |
|---|---|
| `DASHBOARD_PASSCODE` | Protects the dashboard view on the browser |
| `API_KEY` | Authenticates inbound pushes from Cowork tasks |
| `DATABASE_URL` | Neon Postgres connection string (auto-populated by Vercel) |

---

## Data Flow

```
Cowork task completes on schedule
         ↓
POST /api/widgets/update  (x-api-key header)
         ↓
API route validates key → upserts widget in Neon Postgres
         ↓
User opens dashboard URL on phone
         ↓
Enters passcode → sees all widgets, most-recently-updated first
```

---

## Data Model

### `widgets` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `slug` | text | Unique identifier set by Cowork (e.g. `grocery-list`) |
| `title` | text | Display name shown on dashboard (e.g. `Grocery List`) |
| `type` | text | `html`, `markdown`, or `checklist` |
| `content` | jsonb | Shape varies by type (see below) |
| `updated_at` | timestamp | Auto-updated on each push |
| `position` | integer | Reserved for future user-defined ordering; defaults to 0 |

### `checklist_items` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `widget_id` | uuid | Foreign key → widgets |
| `text` | text | Item label |
| `checked` | boolean | Toggled by user; persisted across Cowork re-pushes |
| `position` | integer | Display order |

### Content Shape by Widget Type

**`html` and `markdown`**
```json
{ "body": "<raw html or markdown string>" }
```
Each Cowork push replaces the body entirely.

**`checklist`**
Cowork pushes a flat array of strings:
```json
["Apples", "Chicken breast", "Olive oil"]
```
The API creates or updates rows in `checklist_items`. Checked state is preserved for items whose text is unchanged across pushes. Items whose text has changed are treated as new items (unchecked). Items no longer present in the push are deleted.

---

## API

### `POST /api/widgets/update`

Authenticated by `x-api-key` header matching `API_KEY` env var.

**Request body:**
```json
{
  "slug": "grocery-list",
  "title": "Grocery List",
  "type": "checklist",
  "content": ["Apples", "Chicken breast", "Olive oil"]
}
```

**Behavior:** Upserts the widget by `slug`. Creates it on first push; updates it on subsequent pushes.

**Responses:**
- `200` — success
- `400` — malformed payload (missing required fields or invalid type)
- `401` — missing or invalid API key

### `GET /api/widgets`

Returns all widgets ordered by `updated_at` descending. Called by the frontend on page load. Protected server-side by session (passcode).

---

## Frontend

### Passcode Gate

On first visit (or after session expires), the user sees a single passcode input. On success, a session cookie is set (httpOnly, secure, 7-day expiry). No username. No account. All dashboard API routes (`GET /api/widgets`, checklist toggle) verify the session cookie in the route handler and return `401` if absent or invalid.

### Dashboard Page

- Mobile-first, single-column scrollable feed
- Each widget rendered as a card
- Cards ordered by `updated_at` — most recently pushed floats to top
- Each card shows: title, last updated timestamp, widget content

### Widget Renderers

| Type | Renderer |
|---|---|
| `html` | Sanitized HTML rendered in a contained div (sanitized server-side using `sanitize-html` before storage) |
| `markdown` | Parsed and rendered (using a lightweight library e.g. `marked`) |
| `checklist` | Interactive checklist; each item has a checkbox that toggles `checked` state via `PATCH /api/widgets/[slug]/items/[id]` |

---

## Cowork Integration Guide

The repository ships with a `COWORK-INTEGRATION.md` file containing copy-paste snippets for each widget type. Users add the relevant snippet to their Cowork task instructions.

**Example snippet (checklist):**
```
When your task is complete, push the results to my dashboard:

POST https://your-dashboard.vercel.app/api/widgets/update
Headers: { "x-api-key": "YOUR_API_KEY" }
Body:
{
  "slug": "grocery-list",
  "title": "Grocery List",
  "type": "checklist",
  "content": ["item 1", "item 2", "item 3"]
}
```

One snippet per widget type (html, markdown, checklist) is provided. Users substitute their own Vercel URL, API key, slug, and title.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Wrong API key | `401` response; Cowork task logs the failure |
| Malformed payload | `400` response with descriptive message |
| Checklist re-push | Checked state preserved for unchanged items |
| Passcode wrong | Redirect back to passcode screen; no data exposed |
| Vercel downtime | Cowork retry on next scheduled run; no data permanently lost |

---

## Extensibility Notes

The design is intentionally forward-compatible:

- **New widget types** — add a new renderer on the frontend; no schema changes needed (`type` is a free-form text field, `content` is JSONB)
- **New Cowork tasks** — widgets are auto-created on first push; no dashboard configuration required
- **Future ordering** — `position` column is already present; drag-and-drop can be added without a migration
- **Future widget metadata** — `content` JSONB can absorb new optional fields (icon, color, badge) without breaking existing pushes

---

## Setup Flow (End User)

1. Go to the GitHub repo → click **Deploy to Vercel**
2. Vercel prompts to connect GitHub and create a Neon Postgres database automatically
3. Set `DASHBOARD_PASSCODE` and `API_KEY` in Vercel environment variables
4. Visit the deployed URL → enter passcode → empty dashboard
5. Open each Cowork task → paste the integration snippet → update URL, API key, slug, title
6. Next time the Cowork task runs, the widget appears on the dashboard

Total setup time: ~5 minutes with the README guide.

---

## Open Source Deliverables

- Next.js application (this repository)
- `README.md` — setup guide with Deploy to Vercel button
- `COWORK-INTEGRATION.md` — copy-paste snippets for all widget types
- Database migration script (runs automatically on first deploy)
