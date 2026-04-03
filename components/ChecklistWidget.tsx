'use client'

import { useState } from 'react'
import type { ChecklistItem } from '@/lib/db'

type Props = {
  slug: string
  items: ChecklistItem[]
}

export function ChecklistWidget({ slug, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)

  async function toggle(id: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    )

    try {
      const res = await fetch(`/api/widgets/${slug}/items/${id}`, { method: 'PATCH' })
      if (!res.ok) {
        // Revert on failure
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
        )
      }
    } catch {
      // Revert on network error
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
      )
    }
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
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
      ))}
    </ul>
  )
}
