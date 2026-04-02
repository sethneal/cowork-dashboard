import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)
  const schema = readFileSync(join(process.cwd(), 'schema.sql'), 'utf-8')
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
