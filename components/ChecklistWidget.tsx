'use client'

import { useState } from 'react'
import type { ChecklistItem } from '@/lib/db'

type Props = {
  slug: string
  items: ChecklistItem[]
}

function isHeader(text: string) {
  return text.startsWith('## ')
}

export function ChecklistWidget({ slug, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)

  async function toggle(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    )

    try {
      const res = await fetch(`/api/widgets/${slug}/items/${id}`, { method: 'PATCH' })
      if (!res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
        )
      }
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
      )
    }
  }

  return (
    <ul className="space-y-2">
      {items.map((item) =>
        isHeader(item.text) ? (
          <li key={item.id} className="pt-2 first:pt-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {item.text.slice(3)}
            </span>
          </li>
        ) : (
          <li key={item.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggle(item.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <span
              className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}
            >
              {item.text}
            </span>
          </li>
        )
      )}
    </ul>
  )
}
