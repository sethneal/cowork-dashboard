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
    const savedPasscode = process.env.DASHBOARD_PASSCODE
    try {
      process.env.DASHBOARD_PASSCODE = 'different'
      expect(computeSessionToken()).not.toBe(original)
    } finally {
      process.env.DASHBOARD_PASSCODE = savedPasscode
    }
  })

  it('throws if API_KEY is missing', () => {
    const saved = process.env.API_KEY
    try {
      delete process.env.API_KEY
      expect(() => computeSessionToken()).toThrow('API_KEY and DASHBOARD_PASSCODE environment variables must be set')
    } finally {
      process.env.API_KEY = saved
    }
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

  it('throws if API_KEY env var is missing', () => {
    const saved = process.env.API_KEY
    try {
      delete process.env.API_KEY
      const req = new Request('http://localhost', { headers: { 'x-api-key': 'anything' } })
      expect(() => validateApiKey(req)).toThrow('API_KEY environment variable must be set')
    } finally {
      process.env.API_KEY = saved
    }
  })
})
