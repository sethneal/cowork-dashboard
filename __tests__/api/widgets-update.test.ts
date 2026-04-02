import { POST } from '@/app/api/widgets/update/route'

process.env.API_KEY = 'testkey123'
process.env.DATABASE_URL = 'postgresql://placeholder'

// Mock the db module
jest.mock('@/lib/db', () => ({
  upsertWidget: jest.fn().mockResolvedValue({ id: 'widget-uuid', slug: 'test' }),
  upsertChecklistItems: jest.fn().mockResolvedValue(undefined),
}))

// Mock sanitize to pass-through in tests
jest.mock('@/lib/sanitize', () => ({
  sanitizeHtml: jest.fn((html: string) => html),
}))

function makeRequest(body: unknown, apiKey = 'testkey123') {
  return new Request('http://localhost/api/widgets/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/widgets/update', () => {
  it('returns 401 with wrong API key', async () => {
    const res = await POST(makeRequest({ slug: 'test', title: 'Test', type: 'html', content: '<p>hi</p>' }, 'wrong'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when slug is missing', async () => {
    const res = await POST(makeRequest({ title: 'Test', type: 'html', content: '<p>hi</p>' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid type', async () => {
    const res = await POST(makeRequest({ slug: 'test', title: 'Test', type: 'invalid', content: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when checklist content is not an array', async () => {
    const res = await POST(makeRequest({ slug: 'test', title: 'Test', type: 'checklist', content: 'not an array' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 for valid html widget', async () => {
    const res = await POST(makeRequest({ slug: 'meal-plan', title: 'Meal Plan', type: 'html', content: '<p>Eat well</p>' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 200 for valid checklist widget', async () => {
    const res = await POST(makeRequest({ slug: 'groceries', title: 'Groceries', type: 'checklist', content: ['Apples', 'Milk'] }))
    expect(res.status).toBe(200)
  })

  it('returns 200 for valid markdown widget', async () => {
    const res = await POST(makeRequest({ slug: 'brief', title: 'Daily Brief', type: 'markdown', content: '# Today\n- Item 1' }))
    expect(res.status).toBe(200)
  })

  it('returns 400 for slug with invalid characters', async () => {
    const res = await POST(makeRequest({ slug: 'My Widget!', title: 'Test', type: 'html', content: '<p>hi</p>' }))
    expect(res.status).toBe(400)
  })
})
