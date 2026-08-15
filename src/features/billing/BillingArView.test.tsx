import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildBaseline } from '../../data/baseline'
import { computeProjectKpis } from '../../domain/kpis'
import BillingArView from './BillingArView'

const ds = buildBaseline()
const negProject = ds.projects.find((p) => p.scenarios.includes('negative-claim'))!
const lateArProject = ds.projects.find((p) => p.scenarios.includes('late-ar'))!
const healthyProject = ds.projects.find((p) => p.scenarios.includes('healthy'))!

describe('BillingArView (TASK-009)', () => {
  it('lists every AR document with invoice/credit pills', () => {
    render(<BillingArView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const docs = ds.arDocuments.filter((d) => d.projectId === healthyProject.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(docs.length + 1)
    expect(within(table).getAllByText('Invoice').length).toBe(docs.filter((d) => d.kind === 'invoice').length)
  })

  it('negative-certification project carries credit-note rows', () => {
    render(<BillingArView projectId={negProject.id} onChangeProject={() => {}} />)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByText('Credit Note').length).toBeGreaterThan(0)
  })

  it('shows the AR summary with reconciliation (Billed + Credits − Collected = AR)', () => {
    render(<BillingArView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const project = ds.projects.find((p) => p.id === healthyProject.id)!
    const k = computeProjectKpis(ds, project)
    expect(screen.getByText('Billed')).toBeInTheDocument()
    expect(screen.getByText('Credits')).toBeInTheDocument()
    expect(screen.getByText('Collected')).toBeInTheDocument()
    expect(screen.getByText('AR Exposure')).toBeInTheDocument()
    expect(Math.round((k.billed + k.credits - k.collected) * 100) / 100).toBe(k.ar)
  })

  it('opens an invoice detail with receipts and allocations', async () => {
    const user = userEvent.setup()
    render(<BillingArView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const invoice = ds.arDocuments.find((d) => d.projectId === healthyProject.id && d.kind === 'invoice')!
    await user.click(screen.getByRole('button', { name: invoice.docNo }))
    expect(screen.getByRole('heading', { name: /receipts/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /allocations/i })).toBeInTheDocument()
  })

  it('shows credit applications referencing the credit note (BR-AR-003)', async () => {
    const user = userEvent.setup()
    render(<BillingArView projectId={negProject.id} onChangeProject={() => {}} />)
    const credit = ds.arDocuments.find((d) => d.projectId === negProject.id && d.kind === 'credit-note')
    if (credit) {
      await user.click(screen.getByRole('button', { name: credit.docNo }))
      expect(screen.getByRole('heading', { name: /applied against/i })).toBeInTheDocument()
    }
  })

  it('late-ar projects show outstanding invoices', () => {
    render(<BillingArView projectId={lateArProject.id} onChangeProject={() => {}} />)
    const table = screen.getAllByRole('table')[0]
    const outstanding = ds.arDocuments.filter((d) => d.projectId === lateArProject.id && d.status === 'Issued')
    expect(within(table).getAllByText('Issued').length).toBeGreaterThanOrEqual(outstanding.length)
  })
})
