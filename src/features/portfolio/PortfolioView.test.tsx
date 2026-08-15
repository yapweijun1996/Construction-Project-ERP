import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PortfolioView from './PortfolioView'

describe('PortfolioView (TASK-004)', () => {
  it('lists all 30 projects with their key columns', () => {
    render(<PortfolioView />)
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(31) // header + 30
    expect(screen.getByText(/30 of 30 projects/)).toBeInTheDocument()
    expect(within(table).getByText('SG-2022-001')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    render(<PortfolioView />)
    await user.selectOptions(screen.getByLabelText('Status'), 'Completed')
    expect(screen.getByText(/8 of 30 projects/)).toBeInTheDocument()
  })

  it('filters by scenario', async () => {
    const user = userEvent.setup()
    render(<PortfolioView />)
    await user.selectOptions(screen.getByLabelText('Scenario'), 'negative-claim')
    expect(screen.getByText(/1 of 30 projects/)).toBeInTheDocument()
  })

  it('filters by value band', async () => {
    const user = userEvent.setup()
    render(<PortfolioView />)
    await user.selectOptions(screen.getByLabelText('Value band'), 'gte50m')
    const count = screen.getByText(/of 30 projects/)
    expect(count.textContent).not.toBe('30 of 30 projects')
  })

  it('shows an empty-state note when nothing matches', async () => {
    const user = userEvent.setup()
    render(<PortfolioView />)
    await user.selectOptions(screen.getByLabelText('Status'), 'Completed')
    await user.selectOptions(screen.getByLabelText('Year'), '2026')
    expect(screen.getByRole('status')).toHaveTextContent(/no projects match/i)
  })

  it('opens the project workspace with KPI cards and returns', async () => {
    const user = userEvent.setup()
    render(<PortfolioView />)
    await user.click(screen.getAllByRole('button', { name: 'SG-2022-001' })[0])
    expect(screen.getByRole('heading', { name: /SG-2022-001 — Tuas Advanced Workshop Upgrade/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Workspace KPIs')).toBeInTheDocument()
    for (const label of ['Original Contract', 'Approved Changes', 'Adjusted Contract', 'Work Done', 'Certified', 'Billed', 'Collected', 'AR Exposure', 'Forecast Final Cost', 'POC (Cost)', 'Forecast Margin']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: /back to portfolio/i }))
    expect(screen.getByText(/30 of 30 projects/)).toBeInTheDocument()
  })

  it('keeps the design-system status vocabulary visible', () => {
    render(<PortfolioView />)
    expect(screen.getByRole('heading', { name: /business status vocabulary/i })).toBeInTheDocument()
  })
})
