export async function register() {
  // Check common Vercel/Neon environment variable names
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL

  if (!dbUrl) {
    console.log('[migration] No database URL found — skipping')
    return
  }

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(dbUrl)

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS widgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('html', 'markdown', 'checklist')),
        content JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        position INTEGER NOT NULL DEFAULT 0
      )
    `)

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        checked BOOLEAN NOT NULL DEFAULT false,
        position INTEGER NOT NULL DEFAULT 0,
        UNIQUE (widget_id, text)
      )
    `)

    console.log('[migration] Tables ready')
  } catch (err) {
    console.error('[migration] Failed:', err)
  }
}
