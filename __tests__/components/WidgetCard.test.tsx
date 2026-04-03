import { render, screen } from '@testing-library/react'
import { WidgetCard } from '@/components/WidgetCard'

describe('WidgetCard', () => {
  it('renders the widget title', () => {
    render(
      <WidgetCard title="Meal Plan" updatedAt="2026-04-02T10:00:00Z">
        <p>content</p>
      </WidgetCard>
    )
    expect(screen.getByText('Meal Plan')).toBeInTheDocument()
  })

  it('renders a formatted last-updated timestamp', () => {
    render(
      <WidgetCard title="Test" updatedAt="2026-04-02T10:00:00Z">
        <p>content</p>
      </WidgetCard>
    )
    expect(screen.getByText(/updated/i)).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <WidgetCard title="Test" updatedAt="2026-04-02T10:00:00Z">
        <p data-testid="child">hello</p>
      </WidgetCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
