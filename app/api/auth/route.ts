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
