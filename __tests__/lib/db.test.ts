// These tests are skipped by default — they require a real DATABASE_URL.
// Run manually with: DATABASE_URL=<url> npx jest db.test.ts

const SKIP = !process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://placeholder'

describe('db query functions', () => {
  const { getWidgets, upsertWidget, upsertChecklistItems, toggleChecklistItem } = require('@/lib/db')

  ;(SKIP ? describe.skip : describe)('with database', () => {
    it('upserts a widget and retrieves it', async () => {
      await upsertWidget('test-html', 'Test HTML', 'html', { body: '<p>hello</p>' })
      const widgets = await getWidgets()
      const found = widgets.find((w: any) => w.slug === 'test-html')
      expect(found).toBeDefined()
      expect(found.title).toBe('Test HTML')
      expect(found.content.body).toBe('<p>hello</p>')
    })

    it('upserts checklist items and preserves checked state for unchanged items', async () => {
      const widget = await upsertWidget('test-list', 'Test List', 'checklist', {})
      await upsertChecklistItems(widget.id, ['Apples', 'Bananas'])

      const widgets = await getWidgets()
      const list = widgets.find((w: any) => w.slug === 'test-list')
      const applesId = list.items.find((i: any) => i.text === 'Apples').id
      await toggleChecklistItem(applesId, 'test-list')

      await upsertChecklistItems(widget.id, ['Apples', 'Bananas'])
      const updated = await getWidgets()
      const updatedList = updated.find((w: any) => w.slug === 'test-list')
      const apples = updatedList.items.find((i: any) => i.text === 'Apples')
      const bananas = updatedList.items.find((i: any) => i.text === 'Bananas')
      expect(apples.checked).toBe(true)
      expect(bananas.checked).toBe(false)
    })

    it('deletes items removed from a re-push', async () => {
      const widget = await upsertWidget('test-delete', 'Test Delete', 'checklist', {})
      await upsertChecklistItems(widget.id, ['Keep', 'Remove'])
      await upsertChecklistItems(widget.id, ['Keep'])
      const widgets = await getWidgets()
      const list = widgets.find((w: any) => w.slug === 'test-delete')
      expect(list.items).toHaveLength(1)
      expect(list.items[0].text).toBe('Keep')
    })
  })
})
