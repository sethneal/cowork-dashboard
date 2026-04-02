# Personal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first personal dashboard web app where Claude Cowork scheduled tasks push structured widget content via a REST API, and the user views all widgets in one scrollable feed on their phone.

**Architecture:** Next.js App Router on Vercel serves both the frontend and all API routes from a single codebase. Vercel Neon Postgres stores widgets and checklist state. Authentication is handled by a passcode-protected session cookie (for viewing) and an API key header (for Cowork pushes) — no auth library required.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Vercel Neon Postgres (`@neondatabase/serverless`), `sanitize-html`, `marked`, Jest, `@testing-library/react`

---

## File Map

```
/
├── app/
│   ├── layout.tsx                              # Root layout, Tailwind globals, viewport meta
│   ├── page.tsx                                # Root: redirects to /dashboard or /login
│   ├── login/
│   │   └── page.tsx                            # Passcode input page (client component)
│   ├── dashboard/
│   │   └── page.tsx                            # Dashboard feed (server component)
│   └── api/
│       ├── auth/
│       │   └── route.ts                        # POST /api/auth — validate passcode, set session
│       └── widgets/
│           ├── route.ts                        # GET /api/widgets — list widgets (session-protected)
│           ├── update/
│           │   └── route.ts                    # POST /api/widgets/update — push widget (API-key-protected)
│           └── [slug]/
│               └── items/
│                   └── [id]/
│                       └── route.ts            # PATCH — toggle checklist item checked state
├── components/
│   ├── WidgetCard.tsx                          # Card wrapper: title, last-updated timestamp, children
│   ├── HtmlWidget.tsx                          # Renders sanitized HTML in a contained div
│   ├── MarkdownWidget.tsx                      # Parses and renders markdown via `marked`
│   └── ChecklistWidget.tsx                     # Interactive checklist; each item calls PATCH on toggle
├── lib/
│   ├── db.ts                                   # Neon client + all SQL query functions
│   ├── auth.ts                                 # Session cookie helpers + API key validation
│   └── sanitize.ts                             # sanitize-html wrapper
├── middleware.ts                               # Redirect unauthenticated users away from /dashboard
├── __tests__/
│   ├── lib/
│   │   ├── auth.test.ts
│   │   └── sanitize.test.ts
│   ├── api/
│   │   ├── widgets-update.test.ts
│   │   └── widgets-toggle.test.ts
│   └── components/
│       ├── WidgetCard.test.tsx
│       └── ChecklistWidget.test.tsx
├── .env.local.example                          # Template showing all required env vars
├── README.md                                   # Setup guide + Deploy to Vercel button
└── COWORK-INTEGRATION.md                       # Copy-paste snippets for all 3 widget types
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `jest.config.ts`, `jest.setup.ts`
- Create: `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd "/Users/sethneal/Claude/Code/Personal Dashboard"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint
```

When prompted, answer: Yes to TypeScript, Yes to Tailwind, Yes to App Router, No to `src/` directory.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @neondatabase/serverless sanitize-html marked
npm install --save-dev @types/sanitize-html
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 4: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/lib/**/*.test.ts', '**/__tests__/api/**/*.test.ts'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.test.tsx'],
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
}
export default config
```

- [ ] **Step 5: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to `package.json`**

Add to the `scripts` section:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 7: Update `app/layout.tsx` with mobile viewport meta**

Replace the generated content with:
```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'Personal Cowork task dashboard',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create `.env.local.example`**

```bash
# Copy to .env.local and fill in your values

# Passcode to protect the dashboard view (choose anything you like)
DASHBOARD_PASSCODE=your-passcode-here

# API key Cowork tasks use to push widget data (use a random string, e.g. openssl rand -hex 32)
API_KEY=your-api-key-here

# Neon Postgres connection string (auto-populated by Vercel when you add Neon integration)
DATABASE_URL=postgresql://...
```

- [ ] **Step 9: Create `.env.local` for local development**

```bash
cp .env.local.example .env.local
# Edit .env.local and set:
# DASHBOARD_PASSCODE=testpass
# API_KEY=testkey123
# DATABASE_URL=<your Neon connection string>
```

- [ ] **Step 10: Verify the app starts**

```bash
npm run dev
```

Expected: Server running at http://localhost:3000 with no errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with Tailwind, Jest, and dependencies"
```

---

## Task 2: Database Schema and Query Functions

**Files:**
- Create: `lib/db.ts`
- Create: `schema.sql`

- [ ] **Step 1: Create `schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS widgets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        UNIQUE NOT NULL,
  title      TEXT        NOT NULL,
  type       TEXT        NOT NULL CHECK (type IN ('html', 'markdown', 'checklist')),
  content    JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  position   INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id  UUID        NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  checked    BOOLEAN     NOT NULL DEFAULT false,
  position   INTEGER     NOT NULL DEFAULT 0
);
```

- [ ] **Step 2: Create `scripts/migrate.ts`**

This script runs the schema automatically on first deploy via a Vercel build command.

```typescript
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)
  const schema = readFileSync(join(process.cwd(), 'schema.sql'), 'utf-8')
  // Split on semicolons and run each statement individually
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const statement of statements) {
    await sql.transaction([sql(statement)])
  }
  console.log('Migration complete')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
```

- [ ] **Step 3: Add migrate command to `package.json` and wire into Vercel build**

Add to the `scripts` section of `package.json`:
```json
"migrate": "ts-node --project tsconfig.json scripts/migrate.ts",
"build": "npm run migrate && next build"
```

Install `ts-node`:
```bash
npm install --save-dev ts-node
```

Expected: `npm run migrate` runs the schema SQL against Neon. Tables created if they don't exist (`IF NOT EXISTS` guards prevent errors on re-runs).

- [ ] **Step 4: Verify migration runs cleanly**

```bash
npm run migrate
```

Expected: `Migration complete` with no errors.

- [ ] **Step 3: Write failing tests for db query functions**

Create `__tests__/lib/db.test.ts`:

```typescript
// These tests are skipped by default — they require a real DATABASE_URL.
// Run manually with: DATABASE_URL=<url> npx jest db.test.ts

const SKIP = !process.env.DATABASE_URL

describe('db query functions', () => {
  const { getWidgets, upsertWidget, upsertChecklistItems, toggleChecklistItem } = require('@/lib/db')

  ;(SKIP ? describe.skip : describe)('with database', () => {
    it('upserts a widget and retrieves it', async () => {
      await upsertWidget('test-html', 'Test HTML', 'html', { body: '<p>hello</p>' })
      const widgets = await getWidgets()
      const found = widgets.find((w: any) => w.slug === 'test-html')
      expect(found).toBeDefined()
      expect(found.title).toBe('Test HTML')
      expect(found.content.body).toBe('<p>hello</p>')
    })

    it('upserts checklist items and preserves checked state for unchanged items', async () => {
      const widget = await upsertWidget('test-list', 'Test List', 'checklist', {})
      await upsertChecklistItems(widget.id, ['Apples', 'Bananas'])

      // Toggle Apples
      const widgets = await getWidgets()
      const list = widgets.find((w: any) => w.slug === 'test-list')
      const applesId = list.items.find((i: any) => i.text === 'Apples').id
      await toggleChecklistItem(applesId, 'test-list')

      // Re-push same items — Apples should stay checked, Bananas unchecked
      await upsertChecklistItems(widget.id, ['Apples', 'Bananas'])
      const updated = await getWidgets()
      const updatedList = updated.find((w: any) => w.slug === 'test-list')
      const apples = updatedList.items.find((i: any) => i.text === 'Apples')
      const bananas = updatedList.items.find((i: any) => i.text === 'Bananas')
      expect(apples.checked).toBe(true)
      expect(bananas.checked).toBe(false)
    })

    it('deletes items removed from a re-push', async () => {
      const widget = await upsertWidget('test-delete', 'Test Delete', 'checklist', {})
      await upsertChecklistItems(widget.id, ['Keep', 'Remove'])
      await upsertChecklistItems(widget.id, ['Keep'])
      const widgets = await getWidgets()
      const list = widgets.find((w: any) => w.slug === 'test-delete')
      expect(list.items).toHaveLength(1)
      expect(list.items[0].text).toBe('Keep')
    })
  })
})
```

- [ ] **Step 4: Run tests (expect skip)**

```bash
npx jest db.test.ts
```

Expected: Tests skipped (no DATABASE_URL in env). No failures.

- [ ] **Step 5: Create `lib/db.ts`**

```typescript
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export type Widget = {
  id: string
  slug: string
  title: string
  type: 'html' | 'markdown' | 'checklist'
  content: { body?: string }
  updated_at: string
  position: number
  items: ChecklistItem[]
}

export type ChecklistItem = {
  id: string
  widget_id: string
  text: string
  checked: boolean
  position: number
}

export async function getWidgets(): Promise<Widget[]> {
  const rows = await sql`
    SELECT
      w.id, w.slug, w.title, w.type, w.content, w.updated_at, w.position,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ci.id,
            'widget_id', ci.widget_id,
            'text', ci.text,
            'checked', ci.checked,
            'position', ci.position
          ) ORDER BY ci.position
        ) FILTER (WHERE ci.id IS NOT NULL),
        '[]'
      ) AS items
    FROM widgets w
    LEFT JOIN checklist_items ci ON ci.widget_id = w.id
    GROUP BY w.id
    ORDER BY w.updated_at DESC
  `
  return rows as Widget[]
}

export async function upsertWidget(
  slug: string,
  title: string,
  type: string,
  content: object
): Promise<{ id: string; slug: string }> {
  const rows = await sql`
    INSERT INTO widgets (slug, title, type, content, updated_at)
    VALUES (${slug}, ${title}, ${type}, ${JSON.stringify(content)}, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title      = EXCLUDED.title,
      type       = EXCLUDED.type,
      content    = EXCLUDED.content,
      updated_at = NOW()
    RETURNING id, slug
  `
  return rows[0] as { id: string; slug: string }
}

export async function upsertChecklistItems(
  widgetId: string,
  items: string[]
): Promise<void> {
  const existing = await sql`
    SELECT id, text FROM checklist_items WHERE widget_id = ${widgetId}
  `

  const existingByText = new Map(existing.map((r) => [r.text as string, r.id as string]))
  const newTextSet = new Set(items)

  // Delete items no longer in the new list
  const toDelete = existing
    .filter((r) => !newTextSet.has(r.text as string))
    .map((r) => r.id as string)

  if (toDelete.length > 0) {
    await sql`DELETE FROM checklist_items WHERE id = ANY(${toDelete})`
  }

  // Insert new items; update position for existing ones
  for (let i = 0; i < items.length; i++) {
    const text = items[i]
    const existingId = existingByText.get(text)
    if (existingId) {
      await sql`UPDATE checklist_items SET position = ${i} WHERE id = ${existingId}`
    } else {
      await sql`
        INSERT INTO checklist_items (widget_id, text, checked, position)
        VALUES (${widgetId}, ${text}, false, ${i})
      `
    }
  }
}

export async function toggleChecklistItem(
  id: string,
  widgetSlug: string
): Promise<ChecklistItem | null> {
  const rows = await sql`
    UPDATE checklist_items ci
    SET checked = NOT ci.checked
    FROM widgets w
    WHERE ci.id = ${id}
      AND ci.widget_id = w.id
      AND w.slug = ${widgetSlug}
    RETURNING ci.id, ci.widget_id, ci.text, ci.checked, ci.position
  `
  return (rows[0] as ChecklistItem) ?? null
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts schema.sql __tests__/lib/db.test.ts
git commit -m "feat: add database schema and Neon query functions"
```

---

## Task 3: Auth Utilities

**Files:**
- Create: `lib/auth.ts`
- Create: `__tests__/lib/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/auth.test.ts`:

```typescript
import crypto from 'crypto'

// Set env vars before importing auth module
process.env.DASHBOARD_PASSCODE = 'testpass'
process.env.API_KEY = 'testkey123'

import { computeSessionToken, validateApiKey } from '@/lib/auth'

describe('computeSessionToken', () => {
  it('returns a hex string', () => {
    const token = computeSessionToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('returns the same value when called twice with the same env vars', () => {
    expect(computeSessionToken()).toBe(computeSessionToken())
  })

  it('is derived from both DASHBOARD_PASSCODE and API_KEY', () => {
    const original = computeSessionToken()
    process.env.DASHBOARD_PASSCODE = 'different'
    const changed = computeSessionToken()
    expect(changed).not.toBe(original)
    process.env.DASHBOARD_PASSCODE = 'testpass'
  })
})

describe('validateApiKey', () => {
  it('returns true when x-api-key header matches API_KEY', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-api-key': 'testkey123' },
    })
    expect(validateApiKey(req)).toBe(true)
  })

  it('returns false when x-api-key header is missing', () => {
    const req = new Request('http://localhost')
    expect(validateApiKey(req)).toBe(false)
  })

  it('returns false when x-api-key header is wrong', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-api-key': 'wrongkey' },
    })
    expect(validateApiKey(req)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest auth.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/auth'`

- [ ] **Step 3: Create `lib/auth.ts`**

```typescript
import crypto from 'crypto'

export const SESSION_COOKIE = 'dashboard_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export function computeSessionToken(): string {
  return crypto
    .createHmac('sha256', process.env.API_KEY!)
    .update(process.env.DASHBOARD_PASSCODE!)
    .digest('hex')
}

export function validateApiKey(request: Request): boolean {
  const key = request.headers.get('x-api-key')
  return key === process.env.API_KEY
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest auth.test.ts
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts __tests__/lib/auth.test.ts
git commit -m "feat: add auth utilities (session token + API key validation)"
```

---

## Task 4: HTML Sanitization Utility

**Files:**
- Create: `lib/sanitize.ts`
- Create: `__tests__/lib/sanitize.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/sanitize.test.ts`:

```typescript
import { sanitizeHtml } from '@/lib/sanitize'

describe('sanitizeHtml', () => {
  it('passes through safe HTML unchanged', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    expect(sanitizeHtml(input)).toBe(input)
  })

  it('strips script tags', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>'
    expect(sanitizeHtml(input)).not.toContain('<script>')
    expect(sanitizeHtml(input)).toContain('<p>Safe</p>')
  })

  it('strips onclick and other event handlers', () => {
    const input = '<p onclick="alert(1)">Click me</p>'
    expect(sanitizeHtml(input)).not.toContain('onclick')
  })

  it('strips javascript: hrefs', () => {
    const input = '<a href="javascript:alert(1)">link</a>'
    expect(sanitizeHtml(input)).not.toContain('javascript:')
  })

  it('preserves common formatting tags', () => {
    const tags = ['p', 'ul', 'ol', 'li', 'strong', 'em', 'h1', 'h2', 'h3', 'a', 'br', 'table', 'tr', 'td', 'th']
    for (const tag of tags) {
      const input = `<${tag}>test</${tag}>`
      expect(sanitizeHtml(input)).toContain(tag)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest sanitize.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/sanitize'`

- [ ] **Step 3: Create `lib/sanitize.ts`**

```typescript
import sanitizeHtmlLib from 'sanitize-html'

export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat([
      'h1', 'h2', 'h3', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      '*': ['class', 'style'],
    },
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest sanitize.test.ts
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/sanitize.ts __tests__/lib/sanitize.test.ts
git commit -m "feat: add HTML sanitization utility using sanitize-html"
```

---

## Task 5: Widget Push API — `POST /api/widgets/update`

**Files:**
- Create: `app/api/widgets/update/route.ts`
- Create: `__tests__/api/widgets-update.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/widgets-update.test.ts`:

```typescript
import { POST } from '@/app/api/widgets/update/route'

process.env.API_KEY = 'testkey123'
process.env.DATABASE_URL = 'mock'

// Mock the db module
jest.mock('@/lib/db', () => ({
  upsertWidget: jest.fn().mockResolvedValue({ id: 'widget-uuid', slug: 'test' }),
  upsertChecklistItems: jest.fn().mockResolvedValue(undefined),
}))

// Mock sanitize to pass-through in tests
jest.mock('@/lib/sanitize', () => ({
  sanitizeHtml: jest.fn((html: string) => html),
}))

function makeRequest(body: unknown, apiKey = 'testkey123') {
  return new Request('http://localhost/api/widgets/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/widgets/update', () => {
  it('returns 401 with wrong API key', async () => {
    const res = await POST(makeRequest({ slug: 'test', title: 'Test', type: 'html', content: '<p>hi</p>' }, 'wrong'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when slug is missing', async () => {
    const res = await POST(makeRequest({ title: 'Test', type: 'html', content: '<p>hi</p>' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid type', async () => {
    const res = await POST(makeRequest({ slug: 'test', title: 'Test', type: 'invalid', content: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when checklist content is not an array', async () => {
    const res = await POST(makeRequest({ slug: 'test', title: 'Test', type: 'checklist', content: 'not an array' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 for valid html widget', async () => {
    const res = await POST(makeRequest({ slug: 'meal-plan', title: 'Meal Plan', type: 'html', content: '<p>Eat well</p>' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 200 for valid checklist widget', async () => {
    const res = await POST(makeRequest({ slug: 'groceries', title: 'Groceries', type: 'checklist', content: ['Apples', 'Milk'] }))
    expect(res.status).toBe(200)
  })

  it('returns 200 for valid markdown widget', async () => {
    const res = await POST(makeRequest({ slug: 'brief', title: 'Daily Brief', type: 'markdown', content: '# Today\n- Item 1' }))
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest widgets-update.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/widgets/update/route'`

- [ ] **Step 3: Create `app/api/widgets/update/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { upsertWidget, upsertChecklistItems } from '@/lib/db'
import { sanitizeHtml } from '@/lib/sanitize'

const VALID_TYPES = ['html', 'markdown', 'checklist'] as const

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Payload must be a JSON object' }, { status: 400 })
  }

  const { slug, title, type, content } = payload as Record<string, unknown>

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required and must be a string' }, { status: 400 })
  }
  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'title is required and must be a string' }, { status: 400 })
  }
  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  if (type === 'checklist') {
    if (!Array.isArray(content) || !content.every((i) => typeof i === 'string')) {
      return NextResponse.json(
        { error: 'checklist content must be an array of strings' },
        { status: 400 }
      )
    }
    const widget = await upsertWidget(slug, title, type, {})
    await upsertChecklistItems(widget.id, content)
    return NextResponse.json({ success: true })
  }

  if (typeof content !== 'string') {
    return NextResponse.json(
      { error: 'html and markdown content must be a string' },
      { status: 400 }
    )
  }

  const body = type === 'html' ? sanitizeHtml(content) : content
  await upsertWidget(slug, title, type, { body })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest widgets-update.test.ts
```

Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/widgets/update/route.ts __tests__/api/widgets-update.test.ts
git commit -m "feat: add POST /api/widgets/update route with validation"
```

---

## Task 6: Widget Read API and Checklist Toggle API

**Files:**
- Create: `app/api/widgets/route.ts`
- Create: `app/api/widgets/[slug]/items/[id]/route.ts`
- Create: `__tests__/api/widgets-toggle.test.ts`

- [ ] **Step 1: Write failing test for checklist toggle**

Create `__tests__/api/widgets-toggle.test.ts`:

```typescript
process.env.API_KEY = 'testkey123'
process.env.DASHBOARD_PASSCODE = 'testpass'
process.env.DATABASE_URL = 'mock'

jest.mock('@/lib/db', () => ({
  toggleChecklistItem: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({
      value: require('crypto')
        .createHmac('sha256', 'testkey123')
        .update('testpass')
        .digest('hex'),
    })),
  })),
}))

import { PATCH } from '@/app/api/widgets/[slug]/items/[id]/route'
import { toggleChecklistItem } from '@/lib/db'

const mockToggle = toggleChecklistItem as jest.Mock

describe('PATCH /api/widgets/[slug]/items/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 and toggled item when valid', async () => {
    mockToggle.mockResolvedValue({ id: 'item-1', text: 'Apples', checked: true, position: 0 })
    const req = new Request('http://localhost')
    const res = await PATCH(req, { params: Promise.resolve({ slug: 'groceries', id: 'item-1' }) })
    expect(res.status).toBe(200)
    expect(mockToggle).toHaveBeenCalledWith('item-1', 'groceries')
  })

  it('returns 404 when item not found', async () => {
    mockToggle.mockResolvedValue(null)
    const req = new Request('http://localhost')
    const res = await PATCH(req, { params: Promise.resolve({ slug: 'groceries', id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest widgets-toggle.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `app/api/widgets/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getWidgets } from '@/lib/db'
import { computeSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  if (!session || session.value !== computeSessionToken()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const widgets = await getWidgets()
  return NextResponse.json(widgets)
}
```

- [ ] **Step 4: Create `app/api/widgets/[slug]/items/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { toggleChecklistItem } from '@/lib/db'
import { computeSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  if (!session || session.value !== computeSessionToken()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug, id } = await params
  const item = await toggleChecklistItem(id, slug)

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  return NextResponse.json(item)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest widgets-toggle.test.ts
```

Expected: PASS — 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/widgets/route.ts "app/api/widgets/[slug]/items/[id]/route.ts" __tests__/api/widgets-toggle.test.ts
git commit -m "feat: add GET /api/widgets and PATCH checklist toggle routes"
```

---

## Task 7: Passcode Auth API — `POST /api/auth`

**Files:**
- Create: `app/api/auth/route.ts`

- [ ] **Step 1: Create `app/api/auth/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { computeSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { passcode } = (body as Record<string, unknown>) ?? {}

  if (passcode !== process.env.DASHBOARD_PASSCODE) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, computeSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Manually verify the auth flow**

Start the dev server (`npm run dev`) and run:

```bash
# Wrong passcode — expect 401
curl -s -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"passcode":"wrong"}' | jq

# Correct passcode — expect {"success":true} and Set-Cookie header
curl -sv -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"passcode":"testpass"}' 2>&1 | grep -E "(< Set-Cookie|success)"
```

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/route.ts
git commit -m "feat: add POST /api/auth passcode route"
```

---

## Task 8: Middleware — Protect /dashboard Routes

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function computeSessionToken(): string {
  return crypto
    .createHmac('sha256', process.env.API_KEY!)
    .update(process.env.DASHBOARD_PASSCODE!)
    .digest('hex')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('dashboard_session')
    if (!session || session.value !== computeSessionToken()) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

Note: The session token computation is duplicated here (from `lib/auth.ts`) because Next.js middleware runs in the Edge runtime and cannot import Node.js modules. This is intentional.

- [ ] **Step 2: Verify middleware redirects**

With the dev server running:
1. Visit `http://localhost:3000/dashboard` — you should be redirected to `/login`
2. Log in via the API: `curl -c cookies.txt -X POST http://localhost:3000/api/auth -H "Content-Type: application/json" -d '{"passcode":"testpass"}'`
3. Visit `/dashboard` using those cookies — you should NOT be redirected

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware to protect /dashboard routes"
```

---

## Task 9: Widget Components

**Files:**
- Create: `components/WidgetCard.tsx`
- Create: `components/HtmlWidget.tsx`
- Create: `components/MarkdownWidget.tsx`
- Create: `components/ChecklistWidget.tsx`
- Create: `__tests__/components/WidgetCard.test.tsx`
- Create: `__tests__/components/ChecklistWidget.test.tsx`

- [ ] **Step 1: Write failing tests for WidgetCard**

Create `__tests__/components/WidgetCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { WidgetCard } from '@/components/WidgetCard'

describe('WidgetCard', () => {
  it('renders the widget title', () => {
    render(
      <WidgetCard title="Meal Plan" updatedAt="2026-04-02T10:00:00Z">
        <p>content</p>
      </WidgetCard>
    )
    expect(screen.getByText('Meal Plan')).toBeInTheDocument()
  })

  it('renders a formatted last-updated timestamp', () => {
    render(
      <WidgetCard title="Test" updatedAt="2026-04-02T10:00:00Z">
        <p>content</p>
      </WidgetCard>
    )
    expect(screen.getByText(/updated/i)).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <WidgetCard title="Test" updatedAt="2026-04-02T10:00:00Z">
        <p data-testid="child">hello</p>
      </WidgetCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write failing tests for ChecklistWidget**

Create `__tests__/components/ChecklistWidget.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChecklistWidget } from '@/components/ChecklistWidget'

const mockItems = [
  { id: 'id-1', widget_id: 'w-1', text: 'Apples', checked: false, position: 0 },
  { id: 'id-2', widget_id: 'w-1', text: 'Milk', checked: true, position: 1 },
]

// Mock fetch for toggle calls
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ checked: true }) })
) as jest.Mock

describe('ChecklistWidget', () => {
  it('renders all items', () => {
    render(<ChecklistWidget slug="groceries" items={mockItems} />)
    expect(screen.getByText('Apples')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
  })

  it('reflects checked state visually', () => {
    render(<ChecklistWidget slug="groceries" items={mockItems} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).not.toBeChecked()
    expect(checkboxes[1]).toBeChecked()
  })

  it('calls PATCH endpoint when item is toggled', async () => {
    const user = userEvent.setup()
    render(<ChecklistWidget slug="groceries" items={mockItems} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(fetch).toHaveBeenCalledWith(
      '/api/widgets/groceries/items/id-1',
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest WidgetCard.test.tsx ChecklistWidget.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Create `components/WidgetCard.tsx`**

```tsx
type Props = {
  title: string
  updatedAt: string
  children: React.ReactNode
}

export function WidgetCard({ title, updatedAt, children }: Props) {
  const formatted = new Date(updatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400">Updated {formatted}</span>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}
```

- [ ] **Step 5: Create `components/HtmlWidget.tsx`**

```tsx
type Props = { content: string }

export function HtmlWidget({ content }: Props) {
  return (
    <div
      className="prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
```

Note: Content is sanitized server-side on push (via `lib/sanitize.ts`) before being stored, so rendering raw HTML here is safe.

- [ ] **Step 6: Create `components/MarkdownWidget.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { marked } from 'marked'

type Props = { content: string }

export function MarkdownWidget({ content }: Props) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    setHtml(marked.parse(content) as string)
  }, [content])

  return (
    <div
      className="prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

- [ ] **Step 7: Create `components/ChecklistWidget.tsx`**

```tsx
'use client'

import { useState } from 'react'
import type { ChecklistItem } from '@/lib/db'

type Props = {
  slug: string
  items: ChecklistItem[]
}

export function ChecklistWidget({ slug, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)

  async function toggle(id: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    )

    try {
      const res = await fetch(`/api/widgets/${slug}/items/${id}`, { method: 'PATCH' })
      if (!res.ok) {
        // Revert on failure
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
        )
      }
    } catch {
      // Revert on network error
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
      )
    }
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggle(item.id)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
          <span
            className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}
          >
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx jest WidgetCard.test.tsx ChecklistWidget.test.tsx
```

Expected: PASS — all tests pass.

- [ ] **Step 9: Commit**

```bash
git add components/ __tests__/components/
git commit -m "feat: add WidgetCard, HtmlWidget, MarkdownWidget, ChecklistWidget components"
```

---

## Task 10: Pages — Login and Dashboard

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/page.tsx`
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create `app/page.tsx` (root redirect)**

```tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { computeSessionToken, SESSION_COOKIE } from '@/lib/auth'

export default async function RootPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  if (session?.value === computeSessionToken()) {
    redirect('/dashboard')
  }
  redirect('/login')
}
```

- [ ] **Step 2: Create `app/login/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError('Incorrect passcode. Try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">My Dashboard</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Enter your passcode to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create `app/dashboard/page.tsx`**

```tsx
import { getWidgets } from '@/lib/db'
import { WidgetCard } from '@/components/WidgetCard'
import { HtmlWidget } from '@/components/HtmlWidget'
import { MarkdownWidget } from '@/components/MarkdownWidget'
import { ChecklistWidget } from '@/components/ChecklistWidget'

export default async function DashboardPage() {
  const widgets = await getWidgets()

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>

      {widgets.length === 0 ? (
        <div className="text-center mt-20 space-y-3">
          <p className="text-gray-500 text-sm">No widgets yet.</p>
          <p className="text-gray-400 text-xs">
            Push your first Cowork task output to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {widgets.map((widget) => (
            <WidgetCard key={widget.id} title={widget.title} updatedAt={widget.updated_at}>
              {widget.type === 'html' && <HtmlWidget content={widget.content.body ?? ''} />}
              {widget.type === 'markdown' && <MarkdownWidget content={widget.content.body ?? ''} />}
              {widget.type === 'checklist' && (
                <ChecklistWidget slug={widget.slug} items={widget.items} />
              )}
            </WidgetCard>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Manually smoke test the full UI flow**

With `npm run dev` running:
1. Visit `http://localhost:3000` — should redirect to `/login`
2. Enter wrong passcode — should show error
3. Enter correct passcode (`testpass`) — should redirect to `/dashboard`
4. Dashboard should show "No widgets yet" message
5. Push a test widget:

```bash
curl -X POST http://localhost:3000/api/widgets/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: testkey123" \
  -d '{"slug":"test-note","title":"Test Note","type":"markdown","content":"# Hello\n\nThis is a test widget."}'
```

6. Refresh the dashboard — the widget should appear.
7. Push a checklist:

```bash
curl -X POST http://localhost:3000/api/widgets/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: testkey123" \
  -d '{"slug":"groceries","title":"Grocery List","type":"checklist","content":["Apples","Milk","Bread"]}'
```

8. Refresh — checklist should appear with working checkboxes.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/login/ app/dashboard/
git commit -m "feat: add login and dashboard pages"
```

---

## Task 11: Documentation

**Files:**
- Create: `README.md`
- Create: `COWORK-INTEGRATION.md`

- [ ] **Step 1: Create `README.md`**

````markdown
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
````

- [ ] **Step 2: Create `COWORK-INTEGRATION.md`**

````markdown
# Cowork Integration Guide

Add the appropriate snippet to your Cowork task instructions to push results to your dashboard.

Replace `YOUR_DASHBOARD_URL` with your Vercel deployment URL and `YOUR_API_KEY` with the API key you set during setup.

---

## Checklist Widget (e.g. Grocery List, To-Do List)

```
When your task is complete, push the results to my dashboard:

POST https://YOUR_DASHBOARD_URL/api/widgets/update
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "slug": "grocery-list",
  "title": "Grocery List",
  "type": "checklist",
  "content": ["item 1", "item 2", "item 3"]
}

The "slug" is a unique identifier for this widget (use lowercase letters and hyphens).
The "content" must be a flat array of strings — one string per checklist item.
```

---

## Markdown Widget (e.g. Daily Brief, Summary)

```
When your task is complete, push the results to my dashboard:

POST https://YOUR_DASHBOARD_URL/api/widgets/update
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "slug": "daily-brief",
  "title": "Daily Brief",
  "type": "markdown",
  "content": "# Your markdown content here\n\n- Bullet point\n- Another point"
}

The "content" field accepts standard Markdown formatting.
```

---

## HTML Widget (e.g. Meal Plan, Rich Report)

```
When your task is complete, push the results to my dashboard:

POST https://YOUR_DASHBOARD_URL/api/widgets/update
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "slug": "meal-plan",
  "title": "Weekly Meal Plan",
  "type": "html",
  "content": "<h2>Week of April 7</h2><p>Monday: Chicken stir fry...</p>"
}

The "content" field accepts HTML. Script tags and event handlers are automatically stripped for safety.
```

---

## Tips

- The `slug` is how your widget is identified. Use the same slug each time a task runs to update the same widget.
- A new widget is created automatically the first time a slug is pushed — no dashboard configuration needed.
- Checklist items that were checked off will stay checked even after a Cowork re-push, as long as the item text hasn't changed.
````

- [ ] **Step 3: Commit**

```bash
git add README.md COWORK-INTEGRATION.md
git commit -m "docs: add README with deploy button and Cowork integration guide"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: All tests pass. No failures.

- [ ] **Step 2: Run a production build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Add `.superpowers/` to `.gitignore`**

Open `.gitignore` (created by `create-next-app`) and add:

```
# Brainstorming session files
.superpowers/
```

- [ ] **Step 4: Final commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```

- [ ] **Step 5: Push to GitHub and deploy**

1. Create a new GitHub repo at github.com/new (name it `personal-dashboard`)
2. Push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/personal-dashboard.git
git push -u origin main
```

3. Go to [vercel.com/new](https://vercel.com/new), import the repo, add the Neon integration, set `DASHBOARD_PASSCODE` and `API_KEY`, and deploy.

4. Visit your deployed URL, enter your passcode, and push a test widget:

```bash
curl -X POST https://YOUR_DASHBOARD_URL/api/widgets/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"slug":"welcome","title":"Welcome","type":"markdown","content":"# Dashboard is live!\n\nAdd your Cowork task snippets to start pushing widgets."}'
```

5. Refresh your dashboard — the welcome widget should appear.
````
