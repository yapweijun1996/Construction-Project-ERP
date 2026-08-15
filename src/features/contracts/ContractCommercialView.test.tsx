import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildBaseline } from '../../data/baseline'
import ContractCommercialView from './ContractCommercialView'

const ds = buildBaseline()
const materialProject = ds.projects.find((p) => p.scenarios.includes('physical-material-with-do'))!
const noDoProject = ds.projects.find((p) => p.scenarios.includes('progress-work-no-do'))!

describe('ContractCommercialView (TASK-005)', () => {
  it('shows the main contract summary with adjusted value', () => {
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    expect(screen.getByText('Original Contract')).toBeInTheDocument()
    expect(screen.getByText('Approved Changes')).toBeInTheDocument()
    expect(screen.getByText('Adjusted Contract')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /commercial changes/i })).toBeInTheDocument()
  })

  it('lists commercial changes with signed values and statuses', () => {
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    const changes = ds.commercialChanges.filter((c) => c.projectId === materialProject.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(changes.length + 1)
    expect(within(table).getAllByText(/^\+/)).toHaveLength(changes.filter((c) => c.signedValue >= 0).length)
  })

  it('lists work packages with explicit DO or progress evidence', () => {
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    const wps = ds.workPackages.filter((w) => w.contractId === ds.contracts.find((c) => c.projectId === materialProject.id)!.id)
    const table = screen.getAllByRole('table')[1]
    expect(within(table).getAllByRole('row')).toHaveLength(wps.length + 1)
    expect(within(table).getAllByText('DO Required').length).toBe(wps.filter((w) => w.doRequired).length)
    expect(within(table).getAllByText('Progress Measurement').length).toBe(wps.filter((w) => !w.doRequired).length)
  })

  it('shows no DO-required packages for progress-work-no-do projects', () => {
    render(<ContractCommercialView projectId={noDoProject.id} onChangeProject={() => {}} />)
    const table = screen.getAllByRole('table')[1]
    expect(within(table).queryAllByText('DO Required')).toHaveLength(0)
  })

  it('switches projects via the picker', async () => {
    const user = userEvent.setup()
    let received = ''
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={(id) => { received = id }} />)
    const select = screen.getByLabelText('Project')
    await user.selectOptions(select, noDoProject.id)
    expect(received).toBe(noDoProject.id)
  })

  it('states the no-silent-overwrite rule (BR-CONTRACT-003)', () => {
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    expect(screen.getByRole('note')).toHaveTextContent(/never silently overwritten/i)
  })
})
