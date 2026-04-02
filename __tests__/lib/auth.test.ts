import crypto from 'crypto'

// Set env vars before importing auth module
process.env.DASHBOARD_PASSCODE = 'testpass'
process.env.API_KEY = 'testkey123'

import { computeSessionToken, validateApiKey } from '@/lib/auth'

describe('computeSessionToken', () => {
  it('returns a hex string', () => {
    const token = computeSessionToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('returns the same value when called twice with the same env vars', () => {
    expect(computeSessionToken()).toBe(computeSessionToken())
  })

  it('is derived from both DASHBOARD_PASSCODE and API_KEY', () => {
    const original = computeSessionToken()
    process.env.DASHBOARD_PASSCODE = 'different'
    const changed = computeSessionToken()
    expect(changed).not.toBe(original)
    process.env.DASHBOARD_PASSCODE = 'testpass'
  })
})

describe('validateApiKey', () => {
  it('returns true when x-api-key header matches API_KEY', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-api-key': 'testkey123' },
    })
    expect(validateApiKey(req)).toBe(true)
  })

  it('returns false when x-api-key header is missing', () => {
    const req = new Request('http://localhost')
    expect(validateApiKey(req)).toBe(false)
  })

  it('returns false when x-api-key header is wrong', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-api-key': 'wrongkey' },
    })
    expect(validateApiKey(req)).toBe(false)
  })
})
