import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import userEvent from '@testing-library/user-event'
import App from './App'
import { BUSINESS_STATUSES } from '../ui/statuses'

afterEach(() => {
  window.location.hash = ''
})

describe('App shell (TASK-001)', () => {
  it('renders the product name in the header', () => {
    render(<App />)
    expect(screen.getByText('Construction Project ERP')).toBeInTheDocument()
  })

  it('shows the Overview section by default', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Overview', level: 1 })).toBeInTheDocument()
  })

  it('lists all ten business statuses on the overview', () => {
    render(<App />)
    const list = screen.getByRole('list', { name: /business statuses/i })
    for (const s of BUSINESS_STATUSES) {
      expect(within(list).getByText(s)).toBeInTheDocument()
    }
  })

  it('has a skip link pointing at main content', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('navigates to Progress via a sidebar link and updates the hash', async () => {
    const user = userEvent.setup()
    render(<App />)
    const links = screen.getAllByRole('link', { name: 'Progress' })
    await user.click(links[0])
    expect(window.location.hash).toBe('#progress')
    expect(screen.getByRole('heading', { name: 'Progress', level: 1 })).toBeInTheDocument()
  })

  it('marks the active section with aria-current', () => {
    render(<App />)
    const overviewLinks = screen.getAllByRole('link', { name: 'Overview' })
    expect(overviewLinks[0]).toHaveAttribute('aria-current', 'page')
  })

  it('renders the mobile bottom nav with primary links and a More button', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: /primary navigation \(mobile\)/i })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument()
  })

  it('opens the More sheet listing secondary sections', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /more/i }))
    const sheet = screen.getByRole('dialog', { name: /more sections/i })
    expect(sheet).toBeInTheDocument()
    expect(within(sheet).getByRole('link', { name: 'Billing & AR' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^close$/i }))
    expect(screen.queryByRole('dialog', { name: /more sections/i })).not.toBeInTheDocument()
  })
})
