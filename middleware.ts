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
