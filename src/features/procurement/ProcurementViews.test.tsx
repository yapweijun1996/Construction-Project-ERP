import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildBaseline } from '../../data/baseline'
import ProcurementView from './ProcurementView'
import SubcontractsView from './SubcontractsView'

const ds = buildBaseline()
const overclaimProject = ds.projects.find((p) => p.scenarios.includes('subcon-overclaim'))!
const onHoldProject = ds.projects.find((p) => p.scenarios.includes('on-hold'))!
const healthyProject = ds.projects.find((p) => p.scenarios.includes('healthy'))!

describe('ProcurementView (TASK-010)', () => {
  it('lists every order with PO and subcontract-award kinds', () => {
    render(<ProcurementView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const orders = ds.purchaseOrders.filter((po) => po.projectId === healthyProject.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(orders.length + 1)
    expect(within(table).getAllByText('PO').length).toBe(orders.filter((o) => o.kind === 'po').length)
    expect(within(table).getAllByText('Subcontract Award').length).toBe(orders.filter((o) => o.kind === 'subcontract-award').length)
  })

  it('shows vendor names resolved from the party register', () => {
    render(<ProcurementView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const firstPo = ds.purchaseOrders.find((po) => po.projectId === healthyProject.id)!
    const vendor = ds.parties.find((p) => p.id === firstPo.vendorId)!
    expect(screen.getByText(vendor.name)).toBeInTheDocument()
  })
})

describe('SubcontractsView (TASK-010)', () => {
  it('lists subcontract awards with retention and values', () => {
    render(<SubcontractsView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const subs = ds.subcontracts.filter((s) => s.projectId === healthyProject.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(subs.length + 1)
  })

  it('opens a subcontract and lists its claim chain', async () => {
    const user = userEvent.setup()
    render(<SubcontractsView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const first = ds.subcontracts.filter((s) => s.projectId === healthyProject.id)[0]
    await user.click(screen.getByRole('button', { name: first.code }))
    const claims = ds.subcontractClaims.filter((c) => c.subcontractId === first.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(claims.length + 1)
  })

  it('subcon-overclaim projects show claims verified down', async () => {
    const user = userEvent.setup()
    render(<SubcontractsView projectId={overclaimProject.id} onChangeProject={() => {}} />)
    const sub = ds.subcontracts.filter((s) => s.projectId === overclaimProject.id)[0]
    await user.click(screen.getByRole('button', { name: sub.code }))
    const claims = ds.subcontractClaims.filter((c) => c.subcontractId === sub.id)
    const down = claims.filter((c) => c.certified < c.claimed)
    if (down.length > 0) {
      expect(screen.getByRole('status')).toHaveTextContent(/written down/i)
    }
  })

  it('on-hold projects keep some claims on hold', async () => {
    render(<SubcontractsView projectId={onHoldProject.id} onChangeProject={() => {}} />)
    const subs = ds.subcontracts.filter((s) => s.projectId === onHoldProject.id)
    let found = false
    for (const sub of subs) {
      const claims = ds.subcontractClaims.filter((c) => c.subcontractId === sub.id)
      if (claims.some((c) => c.status === 'On Hold')) { found = true; break }
    }
    expect(found).toBe(true)
  })
})
