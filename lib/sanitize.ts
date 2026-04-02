import sanitizeHtmlLib from 'sanitize-html'

export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat([
      'h1', 'h2', 'h3', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      '*': ['class', 'style'],
    },
  })
}
