'use client'

import { useState, useRef, useEffect } from 'react'
import type { Widget } from '@/lib/db'
import { WidgetCard } from './WidgetCard'
import { HtmlWidget } from './HtmlWidget'
import { MarkdownWidget } from './MarkdownWidget'
import { ChecklistWidget } from './ChecklistWidget'

type Props = {
  widgets: Widget[]
}

export function DashboardTabs({ widgets }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Scroll active tab into view whenever it changes
  useEffect(() => {
    tabRefs.current[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeIndex])

  function goTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, widgets.length - 1)))
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Only switch tabs if horizontal movement is dominant and significant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      goTo(dx < 0 ? activeIndex + 1 : activeIndex - 1)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const widget = widgets[activeIndex]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 pb-3 mb-4 border-b border-gray-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {widgets.map((w, i) => (
          <button
            key={w.id}
            ref={(el) => { tabRefs.current[i] = el }}
            onClick={() => goTo(i)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              i === activeIndex
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {w.title}
          </button>
        ))}
      </div>

      {/* Widget content — swipe left/right to change tab */}
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <WidgetCard title={widget.title} updatedAt={widget.updated_at}>
          {widget.type === 'html' && <HtmlWidget content={widget.content.body ?? ''} />}
          {widget.type === 'markdown' && <MarkdownWidget content={widget.content.body ?? ''} />}
          {widget.type === 'checklist' && (
            <ChecklistWidget slug={widget.slug} items={widget.items} />
          )}
        </WidgetCard>
      </div>

      {/* Position indicator */}
      {widgets.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {widgets.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? 'w-4 h-1.5 bg-blue-600'
                  : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
