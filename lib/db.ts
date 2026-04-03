import { neon } from '@neondatabase/serverless'

// Lazy initialization so module import doesn't throw with placeholder DATABASE_URL
let _sql: ReturnType<typeof neon> | null = null
function getSql() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL!)
  }
  return _sql
}
const sql = new Proxy((() => {}) as unknown as ReturnType<typeof neon>, {
  get(_target, prop) {
    const client = getSql()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
  apply(_target, _thisArg, args) {
    return (getSql() as any)(...args)
  },
}) as ReturnType<typeof neon>

export type WidgetType = 'html' | 'markdown' | 'checklist'

export type Widget = {
  id: string
  slug: string
  title: string
  type: WidgetType
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
  type: WidgetType,
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
  return (rows as { id: string; slug: string }[])[0]
}

export async function upsertChecklistItems(
  widgetId: string,
  items: string[]
): Promise<void> {
  // Deduplicate while preserving first-occurrence order
  const uniqueItems = [...new Set(items)]

  const sql = getSql()

  // Delete items no longer in the list
  await sql`
    DELETE FROM checklist_items
    WHERE widget_id = ${widgetId}
      AND text != ALL(${uniqueItems})
  `

  // Bulk upsert: insert new items, update position for existing ones
  // (ON CONFLICT preserves checked state for existing items)
  for (let i = 0; i < uniqueItems.length; i++) {
    await sql`
      INSERT INTO checklist_items (widget_id, text, checked, position)
      VALUES (${widgetId}, ${uniqueItems[i]}, false, ${i})
      ON CONFLICT (widget_id, text)
      DO UPDATE SET position = EXCLUDED.position
    `
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
  return ((rows as ChecklistItem[])[0]) ?? null
}
