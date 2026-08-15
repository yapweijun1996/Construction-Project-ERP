import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UpdatePrompt from './UpdatePrompt'
import OfflineIndicator from './OfflineIndicator'

describe('UpdatePrompt (TASK-013)', () => {
  it('renders nothing when no refresh is needed', () => {
    const { container } = render(<UpdatePrompt needRefresh={false} onReload={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the update prompt and reloads on demand', async () => {
    const user = userEvent.setup()
    let reloaded = false
    render(<UpdatePrompt needRefresh onReload={() => { reloaded = true }} />)
    expect(screen.getByRole('status')).toHaveTextContent(/new version available/i)
    await user.click(screen.getByRole('button', { name: /reload/i }))
    expect(reloaded).toBe(true)
  })
})

describe('OfflineIndicator (TASK-013)', () => {
  it('renders nothing while online', () => {
    const { container } = render(<OfflineIndicator />)
    expect(container).toBeEmptyDOMElement()
  })
})
