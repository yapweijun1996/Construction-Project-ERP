import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsDialog from './SettingsDialog'
import { serializeBaseline } from '../../domain/seed/engine'
import { buildBaseline } from '../../data/baseline'

describe('SettingsDialog (TASK-013)', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<SettingsDialog open={false} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the seed version and engine version', () => {
    render(<SettingsDialog open onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByText('SG-DEMO-2026.1')).toBeInTheDocument()
    expect(screen.getByText('20260815')).toBeInTheDocument()
  })

  it('resets with a two-step confirmation and recreates the identical baseline', async () => {
    const user = userEvent.setup()
    render(<SettingsDialog open onClose={() => {}} />)
    const before = serializeBaseline(buildBaseline())
    await user.click(screen.getByRole('button', { name: /reset demo data/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be undone/i)
    await user.click(screen.getByRole('button', { name: /confirm reset/i }))
    const after = serializeBaseline(buildBaseline())
    expect(after).toBe(before)
    expect(screen.getByRole('status')).toHaveTextContent(/recreated identically/i)
  })

  it('cancels the reset without touching data', async () => {
    const user = userEvent.setup()
    render(<SettingsDialog open onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: /reset demo data/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('runs the data integrity checks with a green report', async () => {
    const user = userEvent.setup()
    render(<SettingsDialog open onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: /run integrity checks/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/0 failed/)
    expect(screen.getByRole('status')).toHaveTextContent(/passed/)
  })
})
