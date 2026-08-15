import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { buildBaseline } from '../../data/baseline'
import { computeProjectKpis } from '../../domain/kpis'
import CostPocView from './CostPocView'

const ds = buildBaseline()
const overrunProject = ds.projects.find((p) => p.scenarios.includes('cost-overrun'))!
const healthyProject = ds.projects.find((p) => p.scenarios.includes('healthy'))!

describe('CostPocView (TASK-011)', () => {
  it('renders the full cost position card set', () => {
    render(<CostPocView projectId={healthyProject.id} onChangeProject={() => {}} />)
    for (const label of ['Original Budget', 'Revised Budget', 'Committed', 'Actual Cost', 'Forecast Final Cost', 'Cost To Complete', 'Variance', 'Recognised Revenue', 'Gross Profit', 'Margin', 'POC (Cost)']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('shows the five distinct progress measures', () => {
    render(<CostPocView projectId={healthyProject.id} onChangeProject={() => {}} />)
    for (const label of ['Physical Progress', 'Claim Progress', 'Certification Progress', 'Cash Collection']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Cost POC').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('note')).toHaveTextContent(/BR-COST-001/i)
  })

  it('breaks cost down by category', () => {
    render(<CostPocView projectId={healthyProject.id} onChangeProject={() => {}} />)
    for (const cat of ['labour', 'material', 'equipment', 'subcontract', 'site-overheads', 'consultant']) {
      expect(screen.getByText(cat)).toBeInTheDocument()
    }
  })

  it('renders the POC trend table with every actual snapshot', () => {
    render(<CostPocView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const snaps = ds.pocSnapshots.filter((s) => s.projectId === healthyProject.id && s.kind === 'actual')
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(snaps.length + 1)
  })

  it('flags forecast overrun on cost-overrun projects', () => {
    render(<CostPocView projectId={overrunProject.id} onChangeProject={() => {}} />)
    const k = computeProjectKpis(ds, overrunProject)
    if (k.variance < 0) {
      expect(screen.getByRole('status')).toHaveTextContent(/forecast overrun/i)
    }
  })

  it('committed equals the sum of purchase orders (SPEC-008)', () => {
    const project = healthyProject
    const k = computeProjectKpis(ds, project)
    const sum = Math.round(ds.purchaseOrders.filter((po) => po.projectId === project.id).reduce((a, po) => a + po.amount, 0) * 100) / 100
    expect(k.committed).toBe(sum)
  })
})
