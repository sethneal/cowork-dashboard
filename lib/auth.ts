import crypto from 'crypto'

export const SESSION_COOKIE = 'dashboard_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export function computeSessionToken(): string {
  return crypto
    .createHmac('sha256', process.env.API_KEY!)
    .update(process.env.DASHBOARD_PASSCODE!)
    .digest('hex')
}

export function validateApiKey(request: Request): boolean {
  const key = request.headers.get('x-api-key')
  return key === process.env.API_KEY
}
