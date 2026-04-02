import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { toggleChecklistItem } from '@/lib/db'
import { validateSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  if (!validateSessionToken(session?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug, id } = await params
  const item = await toggleChecklistItem(id, slug)

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  return NextResponse.json(item)
}
