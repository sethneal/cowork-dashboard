import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders children when expanded', () => {
    render(
      <WidgetCard title="Test" updatedAt="2026-04-02T10:00:00Z">
        <p data-testid="child">hello</p>
      </WidgetCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('hides children when collapsed', async () => {
    const user = userEvent.setup()
    render(
      <WidgetCard title="Test" updatedAt="2026-04-02T10:00:00Z">
        <p data-testid="child">hello</p>
      </WidgetCard>
    )
    await user.click(screen.getByRole('button'))
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })

  it('shows children again when expanded after collapse', async () => {
    const user = userEvent.setup()
    render(
      <WidgetCard title="Test" updatedAt="2026-04-02T10:00:00Z">
        <p data-testid="child">hello</p>
      </WidgetCard>
    )
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('button'))
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
