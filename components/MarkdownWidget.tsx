'use client'

import { useEffect, useState } from 'react'
import { marked } from 'marked'

type Props = { content: string }

export function MarkdownWidget({ content }: Props) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    setHtml(marked.parse(content) as string)
  }, [content])

  return (
    <div
      className="prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
