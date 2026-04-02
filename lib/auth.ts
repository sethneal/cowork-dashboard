import crypto from 'crypto'

export const SESSION_COOKIE = 'dashboard_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

// Deterministic token: same env vars always produce the same session value.
// This is intentional — rotation requires redeploying with new env vars.
export function computeSessionToken(): string {
  const key = process.env.API_KEY
  const passcode = process.env.DASHBOARD_PASSCODE
  if (!key || !passcode) {
    throw new Error('API_KEY and DASHBOARD_PASSCODE environment variables must be set')
  }
  return crypto.createHmac('sha256', key).update(passcode).digest('hex')
}

export function validateApiKey(request: Request): boolean {
  const expected = process.env.API_KEY
  if (!expected) throw new Error('API_KEY environment variable must be set')
  const key = request.headers.get('x-api-key')
  if (!key) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected))
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false
  }
}

export function validateSessionToken(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  const expected = computeSessionToken()
  try {
    return crypto.timingSafeEqual(Buffer.from(cookieValue), Buffer.from(expected))
  } catch {
    return false
  }
}
