import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildBaseline } from '../../data/baseline'
import DocumentsView from './DocumentsView'
import CloseoutView from './CloseoutView'

const ds = buildBaseline()
const dlpProject = ds.projects.find((p) => p.status === 'DLP')!
const fadProject = ds.projects.find((p) => p.status === 'Final Account Dispute')!
const completedProject = ds.projects.find((p) => p.status === 'Completed')!
const healthyProject = ds.projects.find((p) => p.scenarios.includes('healthy'))!

describe('DocumentsView (TASK-012)', () => {
  it('lists every document with revisions', () => {
    render(<DocumentsView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const docs = ds.documents.filter((d) => d.projectId === healthyProject.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(docs.length + 1)
  })

  it('filters by category', async () => {
    const user = userEvent.setup()
    render(<DocumentsView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const docs = ds.documents.filter((d) => d.projectId === healthyProject.id)
    const cats = [...new Set(docs.map((d) => d.category))]
    if (cats.includes('claim')) {
      await user.selectOptions(screen.getByLabelText('Category'), 'claim')
      const claimDocs = docs.filter((d) => d.category === 'claim')
      expect(screen.getByText(new RegExp('Document Register \\(' + claimDocs.length + '\\)'))).toBeInTheDocument()
    }
  })
})

describe('CloseoutView (TASK-012)', () => {
  it('shows retention receivable and payable with release amounts', () => {
    render(<CloseoutView projectId={healthyProject.id} onChangeProject={() => {}} />)
    expect(screen.getByText('Retention Status')).toBeInTheDocument()
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByText(/receivable \(client\)/i).length).toBe(1)
    expect(within(table).getAllByText(/payable \(subcontractors\)/i).length).toBe(1)
  })

  it('DLP projects list defect items', () => {
    render(<CloseoutView projectId={dlpProject.id} onChangeProject={() => {}} />)
    const defects = ds.documents.filter((d) => d.projectId === dlpProject.id && d.category === 'defects')
    expect(defects.length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /defect list/i })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: /defect items/i })).toBeInTheDocument()
  })

  it('completed projects show a final account and closeout note', () => {
    render(<CloseoutView projectId={completedProject.id} onChangeProject={() => {}} />)
    expect(screen.getByRole('heading', { name: /final account/i })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/practical completion achieved/i)
  })

  it('final-account-dispute projects flag the dispute', () => {
    render(<CloseoutView projectId={fadProject.id} onChangeProject={() => {}} />)
    expect(screen.getByRole('note')).toHaveTextContent(/in dispute/i)
  })
})
