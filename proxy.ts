import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken, SESSION_COOKIE } from '@/lib/auth'

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)
  if (!validateSessionToken(session?.value)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
