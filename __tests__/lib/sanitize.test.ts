import { sanitizeHtml } from '@/lib/sanitize'

describe('sanitizeHtml', () => {
  it('passes through safe HTML unchanged', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    expect(sanitizeHtml(input)).toBe(input)
  })

  it('strips script tags', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>'
    expect(sanitizeHtml(input)).not.toContain('<script>')
    expect(sanitizeHtml(input)).toContain('<p>Safe</p>')
  })

  it('strips onclick and other event handlers', () => {
    const input = '<p onclick="alert(1)">Click me</p>'
    expect(sanitizeHtml(input)).not.toContain('onclick')
  })

  it('strips javascript: hrefs', () => {
    const input = '<a href="javascript:alert(1)">link</a>'
    expect(sanitizeHtml(input)).not.toContain('javascript:')
  })

  it('preserves common formatting tags', () => {
    const tags = ['p', 'ul', 'ol', 'li', 'strong', 'em', 'h1', 'h2', 'h3', 'a', 'br', 'table', 'tr', 'td', 'th']
    for (const tag of tags) {
      const input = `<${tag}>test</${tag}>`
      expect(sanitizeHtml(input)).toContain(tag)
    }
  })

  it('strips style attributes', () => {
    const input = '<p style="background:url(http://evil.com)">text</p>'
    expect(sanitizeHtml(input)).not.toContain('style=')
  })
})
