import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChecklistWidget } from '@/components/ChecklistWidget'

const mockItems = [
  { id: 'id-1', widget_id: 'w-1', text: 'Apples', checked: false, position: 0 },
  { id: 'id-2', widget_id: 'w-1', text: 'Milk', checked: true, position: 1 },
]

// Mock fetch for toggle calls
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ checked: true }) })
) as jest.Mock

describe('ChecklistWidget', () => {
  it('renders all items', () => {
    render(<ChecklistWidget slug="groceries" items={mockItems} />)
    expect(screen.getByText('Apples')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
  })

  it('reflects checked state visually', () => {
    render(<ChecklistWidget slug="groceries" items={mockItems} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).not.toBeChecked()
    expect(checkboxes[1]).toBeChecked()
  })

  it('calls PATCH endpoint when item is toggled', async () => {
    const user = userEvent.setup()
    render(<ChecklistWidget slug="groceries" items={mockItems} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(fetch).toHaveBeenCalledWith(
      '/api/widgets/groceries/items/id-1',
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})
