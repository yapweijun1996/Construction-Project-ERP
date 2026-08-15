import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { buildBaseline } from '../../data/baseline'
import ProgressView from './ProgressView'

const ds = buildBaseline()
const project = ds.projects.find((p) => p.scenarios.includes('physical-material-with-do'))!
const noDoProject = ds.projects.find((p) => p.scenarios.includes('progress-work-no-do'))!

describe('ProgressView (TASK-006)', () => {
  it('shows the latest plan/actual KPIs', () => {
    render(<ProgressView projectId={project.id} onChangeProject={() => {}} />)
    expect(screen.getByText('Latest Actual')).toBeInTheDocument()
    expect(screen.getByText('Latest Plan')).toBeInTheDocument()
    expect(screen.getByText('Monthly Movement')).toBeInTheDocument()
  })

  it('lists every measurement for the project with plan/actual kinds', () => {
    render(<ProgressView projectId={project.id} onChangeProject={() => {}} />)
    const measurements = ds.progressMeasurements.filter((m) => m.projectId === project.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(measurements.length + 1)
    expect(within(table).getAllByText('Actual').length).toBe(measurements.filter((m) => m.kind === 'actual').length)
  })

  it('renders progress bars with accessible labels', () => {
    render(<ProgressView projectId={project.id} onChangeProject={() => {}} />)
    const bars = screen.getAllByRole('progressbar')
    expect(bars.length).toBe(ds.progressMeasurements.filter((m) => m.projectId === project.id).length)
  })

  it('lists work packages with DO vs progress evidence', () => {
    render(<ProgressView projectId={project.id} onChangeProject={() => {}} />)
    const contract = ds.contracts.find((c) => c.projectId === project.id)!
    const wps = ds.workPackages.filter((w) => w.contractId === contract.id)
    const table = screen.getAllByRole('table')[1]
    expect(within(table).getAllByRole('row')).toHaveLength(wps.length + 1)
    expect(within(table).getAllByText('DO Required').length).toBe(wps.filter((w) => w.doRequired).length)
  })

  it('shows no DO packages for progress-work-no-do projects', () => {
    render(<ProgressView projectId={noDoProject.id} onChangeProject={() => {}} />)
    const table = screen.getAllByRole('table')[1]
    expect(within(table).queryAllByText('DO Required')).toHaveLength(0)
  })
})
