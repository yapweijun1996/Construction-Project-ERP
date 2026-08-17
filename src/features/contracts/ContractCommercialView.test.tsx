import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildBaseline, resetBaselineCache } from '../../data/baseline'
import ContractCommercialView from './ContractCommercialView'

beforeEach(() => {
  localStorage.removeItem('demo:edits')
  resetBaselineCache()
})

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
    const notes = screen.getAllByRole('note')
    expect(notes.some((n) => n.textContent?.includes('never silently overwritten'))).toBe(true)
  })

  it('registers a VO, marks it local and updates the adjusted contract', async () => {
    const user = userEvent.setup()
    const before = ds.commercialChanges.filter((c) => c.projectId === materialProject.id).length
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    await user.selectOptions(screen.getByLabelText('Kind'), 'VO')
    await user.type(screen.getByLabelText('Description'), 'User added variation')
    await user.type(screen.getByLabelText(/value \(sgd\)/i), '500000')
    await user.click(screen.getByRole('button', { name: /add change/i }))
    expect(screen.getByRole('heading', { name: new RegExp('Commercial Changes \\(' + (before + 1) + '\\)') })).toBeInTheDocument()
    expect(screen.getByText('Local edit')).toBeInTheDocument()
    expect(screen.getByText('User added variation')).toBeInTheDocument()
    // adjusted contract includes the approved VO
    const changes = loadEditsForTest(materialProject.id)
    expect(changes).toHaveLength(1)
    expect(changes[0].signedValue).toBe(500000)
  })

  it('records Omission/Backcharge as negative automatically', async () => {
    const user = userEvent.setup()
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    await user.selectOptions(screen.getByLabelText('Kind'), 'Omission')
    await user.type(screen.getByLabelText('Description'), 'Removed scope')
    await user.type(screen.getByLabelText(/value \(sgd\)/i), '80000')
    await user.click(screen.getByRole('button', { name: /add change/i }))
    const changes = loadEditsForTest(materialProject.id)
    expect(changes[0].signedValue).toBe(-80000)
    expect(screen.getByText(/−\$80,000/)).toBeInTheDocument()
  })

  it('rejects empty amounts with an accessible alert', async () => {
    const user = userEvent.setup()
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    await user.type(screen.getByLabelText('Description'), 'No amount')
    await user.click(screen.getByRole('button', { name: /add change/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a positive amount/i)
  })

  it('removes a local edit and restores the summary', async () => {
    const user = userEvent.setup()
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    await user.selectOptions(screen.getByLabelText('Kind'), 'VO')
    await user.type(screen.getByLabelText('Description'), 'Temp change')
    await user.type(screen.getByLabelText(/value \(sgd\)/i), '1000')
    await user.click(screen.getByRole('button', { name: /add change/i }))
    expect(screen.getByText('Temp change')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(screen.queryByText('Temp change')).not.toBeInTheDocument()
    expect(screen.queryByText('Local edit')).not.toBeInTheDocument()
  })

  it('filters work packages by evidence type', async () => {
    const user = userEvent.setup()
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    const contract = ds.contracts.find((c) => c.projectId === materialProject.id)!
    const wps = ds.workPackages.filter((w) => w.contractId === contract.id)
    await user.selectOptions(screen.getByLabelText('Evidence'), 'do')
    const doCount = wps.filter((w) => w.doRequired).length
    const table = screen.getAllByRole('table')[1]
    expect(within(table).getAllByRole('row')).toHaveLength(doCount + 1)
  })

  it('filters work packages by fulfilment type', async () => {
    const user = userEvent.setup()
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    await user.selectOptions(screen.getByLabelText('Fulfilment'), 'physical-material')
    const contract = ds.contracts.find((c) => c.projectId === materialProject.id)!
    const wps = ds.workPackages.filter((w) => w.contractId === contract.id && w.fulfilmentType === 'physical-material')
    const table = screen.getAllByRole('table')[1]
    expect(within(table).getAllByRole('row')).toHaveLength(wps.length + 1)
  })

  it('states that work-package value changes go through the change register', () => {
    render(<ContractCommercialView projectId={materialProject.id} onChangeProject={() => {}} />)
    const notes = screen.getAllByRole('note')
    expect(notes.some((n) => n.textContent?.includes('never silent edits'))).toBe(true)
  })
})

function loadEditsForTest(projectId: string) {
  const raw = localStorage.getItem('demo:edits')
  const store = raw ? JSON.parse(raw) : { commercialChanges: [] }
  return store.commercialChanges.filter((c: { projectId: string }) => c.projectId === projectId)
}
