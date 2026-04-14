'use client'

import { useState, useRef, useEffect } from 'react'
import type { Widget } from '@/lib/db'
import { WidgetCard } from './WidgetCard'
import { HtmlWidget } from './HtmlWidget'
import { MarkdownWidget } from './MarkdownWidget'
import { ChecklistWidget } from './ChecklistWidget'
import { SnakeGame } from './SnakeGame'

const SNAKE_TAB = '__snake__'

type Props = {
  widgets: Widget[]
}

export function DashboardTabs({ widgets }: Props) {
  const totalTabs = widgets.length + 1 // +1 for Snake
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    tabRefs.current[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeIndex])

  function goTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, totalTabs - 1)))
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      goTo(dx < 0 ? activeIndex + 1 : activeIndex - 1)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const isSnake = activeIndex === widgets.length
  const widget = !isSnake ? widgets[activeIndex] : null

  // Tab labels — widget titles + snake tab
  const tabs = [
    ...widgets.map((w) => ({ id: w.id, label: w.title })),
    { id: SNAKE_TAB, label: '🐍' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 pb-3 mb-4 border-b border-gray-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[i] = el }}
            onClick={() => goTo(i)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              i === activeIndex
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {isSnake ? (
          <SnakeGame />
        ) : widget ? (
          <WidgetCard title={widget.title} updatedAt={widget.updated_at}>
            {widget.type === 'html' && <HtmlWidget content={widget.content.body ?? ''} />}
            {widget.type === 'markdown' && <MarkdownWidget content={widget.content.body ?? ''} />}
            {widget.type === 'checklist' && (
              <ChecklistWidget slug={widget.slug} items={widget.items} />
            )}
          </WidgetCard>
        ) : null}
      </div>

      {/* Position indicator */}
      {totalTabs > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {tabs.map((_, i) => (
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
