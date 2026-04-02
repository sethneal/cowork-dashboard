import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { upsertWidget, upsertChecklistItems, WidgetType } from '@/lib/db'
import { sanitizeHtml } from '@/lib/sanitize'

const VALID_TYPES: WidgetType[] = ['html', 'markdown', 'checklist']

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Payload must be a JSON object' }, { status: 400 })
  }

  const { slug, title, type, content } = payload as Record<string, unknown>

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required and must be a string' }, { status: 400 })
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug must contain only lowercase letters, numbers, and hyphens' }, { status: 400 })
  }
  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'title is required and must be a string' }, { status: 400 })
  }
  if (!type || !VALID_TYPES.includes(type as WidgetType)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  if (type === 'checklist') {
    if (!Array.isArray(content) || !content.every((i) => typeof i === 'string')) {
      return NextResponse.json(
        { error: 'checklist content must be an array of strings' },
        { status: 400 }
      )
    }
    const widget = await upsertWidget(slug, title, type as WidgetType, {})
    await upsertChecklistItems(widget.id, content)
    return NextResponse.json({ success: true })
  }

  if (typeof content !== 'string') {
    return NextResponse.json(
      { error: 'html and markdown content must be a string' },
      { status: 400 }
    )
  }

  const body = type === 'html' ? sanitizeHtml(content) : content
  await upsertWidget(slug, title, type as WidgetType, { body })
  return NextResponse.json({ success: true })
}
