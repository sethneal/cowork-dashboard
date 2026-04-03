type Props = {
  title: string
  updatedAt: string
  children: React.ReactNode
}

export function WidgetCard({ title, updatedAt, children }: Props) {
  const formatted = new Date(updatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400">Updated {formatted}</span>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}
