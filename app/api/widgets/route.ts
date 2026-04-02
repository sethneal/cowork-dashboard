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
