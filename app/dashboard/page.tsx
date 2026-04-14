export const dynamic = 'force-dynamic'

import { getWidgets } from '@/lib/db'
import { DashboardTabs } from '@/components/DashboardTabs'

export default async function DashboardPage() {
  const widgets = await getWidgets()

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cowork Dashboard</h1>

      {widgets.length === 0 ? (
        <div className="text-center mt-20 space-y-3">
          <p className="text-gray-500 text-sm">No widgets yet.</p>
          <p className="text-gray-400 text-xs">
            Push your first Cowork task output to get started.
          </p>
        </div>
      ) : (
        <DashboardTabs widgets={widgets} />
      )}
    </main>
  )
}
