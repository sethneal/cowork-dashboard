export async function register() {
  // Only run on the server, not during the build step
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!process.env.DATABASE_URL) return

  const { neon } = await import('@neondatabase/serverless')
  const { readFileSync } = await import('fs')
  const { join } = await import('path')

  try {
    const sql = neon(process.env.DATABASE_URL)
    const schema = readFileSync(join(process.cwd(), 'schema.sql'), 'utf-8')
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const statement of statements) {
      await sql.unsafe(statement)
    }
    console.log('[instrumentation] Migration complete')
  } catch (err) {
    console.error('[instrumentation] Migration failed:', err)
  }
}
