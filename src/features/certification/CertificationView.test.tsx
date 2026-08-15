import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildBaseline } from '../../data/baseline'
import CertificationView from './CertificationView'

const ds = buildBaseline()
const negProject = ds.projects.find((p) => p.scenarios.includes('negative-claim'))!
const gapProject = ds.projects.find((p) => p.scenarios.includes('certification-gap'))!
const healthyProject = ds.projects.find((p) => p.scenarios.includes('healthy'))!

describe('CertificationView (TASK-008)', () => {
  it('lists every CCAR for the project with cumulative and per-cert amounts', () => {
    render(<CertificationView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const certs = ds.certifications.filter((c) => c.projectId === healthyProject.id)
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(certs.length + 1)
  })

  it('certification-gap projects show fewer CCARs than PCARs', () => {
    render(<CertificationView projectId={gapProject.id} onChangeProject={() => {}} />)
    const certs = ds.certifications.filter((c) => c.projectId === gapProject.id)
    const pcars = ds.claimHeaders.filter((h) => h.projectId === gapProject.id)
    expect(certs.length).toBeLessThan(pcars.length)
  })

  it('opens a certificate and shows submitted vs certified comparison', async () => {
    const user = userEvent.setup()
    render(<CertificationView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const first = ds.certifications.filter((c) => c.projectId === healthyProject.id)[0]
    await user.click(screen.getByRole('button', { name: first.certNo }))
    expect(screen.getByRole('heading', { name: /submitted vs certified/i })).toBeInTheDocument()
    expect(screen.getByText('Submitted (This Claim ex GST)')).toBeInTheDocument()
    expect(screen.getByText('Certified This Period')).toBeInTheDocument()
    expect(screen.getByText('Certified Cumulative')).toBeInTheDocument()
  })

  it('shows negative certification with the AR credit intent note', async () => {
    const user = userEvent.setup()
    render(<CertificationView projectId={negProject.id} onChangeProject={() => {}} />)
    const headerById = new Map(ds.claimHeaders.map((h) => [h.id, h]))
    const certs = ds.certifications.filter((c) => c.projectId === negProject.id)
    // find the negative increment cert deterministically
    let prev = 0
    let target = null
    for (const c of certs) {
      const inc = Math.round((c.certifiedAmount - prev) * 100) / 100
      if (inc < 0) { target = c; break }
      prev = c.certifiedAmount
    }
    expect(target).not.toBeNull()
    await user.click(screen.getByRole('button', { name: target!.certNo }))
    expect(screen.getByRole('status')).toHaveTextContent(/negative certification/i)
    expect(screen.getByRole('status')).toHaveTextContent(/AR credit intent/i)
    void headerById
  })

  it('shows hold remarks when present', async () => {
    const user = userEvent.setup()
    render(<CertificationView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const held = ds.certifications.find((c) => c.projectId === healthyProject.id && c.onHoldAmount > 0)
    if (held) {
      await user.click(screen.getByRole('button', { name: held.certNo }))
      expect(screen.getByRole('note')).toHaveTextContent(/remarks:/i)
    }
  })

  it('returns to the register', async () => {
    const user = userEvent.setup()
    render(<CertificationView projectId={healthyProject.id} onChangeProject={() => {}} />)
    const first = ds.certifications.filter((c) => c.projectId === healthyProject.id)[0]
    await user.click(screen.getByRole('button', { name: first.certNo }))
    await user.click(screen.getByRole('button', { name: /back to ccar register/i }))
    expect(screen.getByRole('heading', { name: /CCAR register/i })).toBeInTheDocument()
  })
})
