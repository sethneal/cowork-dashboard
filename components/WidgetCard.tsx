'use client'

import { useState } from 'react'

type Props = {
  title: string
  updatedAt: string
  children: React.ReactNode
}

export function WidgetCard({ title, updatedAt, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const formatted = new Date(updatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full px-4 pt-4 pb-3 flex items-center justify-between text-left"
      >
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {!collapsed && (
            <span className="text-xs text-gray-400">Updated {formatted}</span>
          )}
          <span className="text-gray-400 text-sm">{collapsed ? '▸' : '▾'}</span>
        </div>
      </button>
      {!collapsed && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
