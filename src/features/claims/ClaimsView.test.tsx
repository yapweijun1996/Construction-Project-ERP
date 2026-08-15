import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildBaseline } from '../../data/baseline'
import ClaimsView from './ClaimsView'

const ds = buildBaseline()
const project = ds.projects.find((p) => p.scenarios.includes('negative-claim'))!
const healthyProject = ds.projects.find((p) => p.scenarios.includes('healthy'))!

describe('ClaimsView (TASK-007)', () => {
  it('lists every PCAR for the project', () => {
    render(<ClaimsView projectId={project.id} onChangeProject={() => {}} />)
    const headers = ds.claimHeaders.filter((h) => h.projectId === project.id)
    expect(screen.getByRole('heading', { name: /PCAR register/i })).toBeInTheDocument()
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(headers.length + 1)
  })

  it('highlights the negative current claim in the register', () => {
    render(<ClaimsView projectId={project.id} onChangeProject={() => {}} />)
    const table = screen.getAllByRole('table')[0]
    const negative = ds.claimHeaders.filter((h) => h.projectId === project.id && h.thisClaimExGst < 0)
    expect(negative.length).toBeGreaterThan(0)
    expect(within(table).getAllByText(/^−\$\d/).length).toBeGreaterThanOrEqual(negative.length)
  })

  it('opens the wizard and shows the SPEC-004 summary fields', async () => {
    const user = userEvent.setup()
    render(<ClaimsView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const first = ds.claimHeaders.filter((h) => h.projectId === healthyProject.id)[0]
    await user.click(screen.getByRole('button', { name: first.claimNo }))
    expect(screen.getByRole('heading', { name: new RegExp(first.claimNo) })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /4\. review/i }))
    expect(screen.getByText('Current Cumulative Entitlement')).toBeInTheDocument()
    expect(screen.getByText('Previous Certified')).toBeInTheDocument()
    expect(screen.getByText('This Claim ex GST')).toBeInTheDocument()
    expect(screen.getByText(/GST \(/)).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('shows work lines with prior/current percentages and movement', async () => {
    const user = userEvent.setup()
    render(<ClaimsView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const first = ds.claimHeaders.filter((h) => h.projectId === healthyProject.id)[0]
    await user.click(screen.getByRole('button', { name: first.claimNo }))
    await user.click(screen.getByRole('button', { name: /2\. work done/i }))
    const lines = ds.claimLines.filter((l) => l.headerId === first.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(lines.length + 1)
  })

  it('flags the negative claim in the review summary', async () => {
    const user = userEvent.setup()
    render(<ClaimsView projectId={project.id} onChangeProject={() => {}} />)
    const negative = ds.claimHeaders.find((h) => h.projectId === project.id && h.thisClaimExGst < 0)!
    await user.click(screen.getByRole('button', { name: negative.claimNo }))
    await user.click(screen.getByRole('button', { name: /4\. review/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/negative claim/i)
  })

  it('walks forward and back through the steps', async () => {
    const user = userEvent.setup()
    render(<ClaimsView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const first = ds.claimHeaders.filter((h) => h.projectId === healthyProject.id)[0]
    await user.click(screen.getByRole('button', { name: first.claimNo }))
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('heading', { name: /work done/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(screen.getByRole('heading', { name: /prelim/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back to pcar register/i }))
    expect(screen.getByRole('heading', { name: /PCAR register/i })).toBeInTheDocument()
  })
})
