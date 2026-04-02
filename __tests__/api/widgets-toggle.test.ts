process.env.API_KEY = 'testkey123'
process.env.DASHBOARD_PASSCODE = 'testpass'
process.env.DATABASE_URL = 'postgresql://placeholder'

jest.mock('@/lib/db', () => ({
  toggleChecklistItem: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({
      value: require('crypto')
        .createHmac('sha256', 'testkey123')
        .update('testpass')
        .digest('hex'),
    })),
  })),
}))

import { PATCH } from '@/app/api/widgets/[slug]/items/[id]/route'
import { toggleChecklistItem } from '@/lib/db'

const mockToggle = toggleChecklistItem as jest.Mock

describe('PATCH /api/widgets/[slug]/items/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 and toggled item when valid', async () => {
    mockToggle.mockResolvedValue({ id: 'item-1', text: 'Apples', checked: true, position: 0 })
    const req = new Request('http://localhost')
    const res = await PATCH(req, { params: Promise.resolve({ slug: 'groceries', id: 'item-1' }) })
    expect(res.status).toBe(200)
    expect(mockToggle).toHaveBeenCalledWith('item-1', 'groceries')
  })

  it('returns 404 when item not found', async () => {
    mockToggle.mockResolvedValue(null)
    const req = new Request('http://localhost')
    const res = await PATCH(req, { params: Promise.resolve({ slug: 'groceries', id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})
