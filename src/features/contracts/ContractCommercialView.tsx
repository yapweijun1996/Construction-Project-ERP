/**
 * TASK-005 — Contract & Commercial register (SPEC-003).
 *
 * Shows the main contract, commercial changes (VO/Omission/Adjustment/
 * Revised PO/Backcharge) and work packages with explicit DO/measurement
 * evidence. Certified/billed history is never silently overwritten
 * (BR-CONTRACT-003): revisions are visible as adjustment entries.
 */

import { useMemo } from 'react'
import { buildBaseline } from '../../data/baseline'
import { formatSgd } from '../../domain/kpis'
import StatusPill from '../../ui/StatusPill'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

function signed(value: number): string {
  return (value >= 0 ? '+' : '−') + formatSgd(Math.abs(value))
}

export default function ContractCommercialView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)
  const contract = ds.contracts.find((c) => c.projectId === projectId)
  const changes = ds.commercialChanges.filter((c) => c.projectId === projectId)
  const workPackages = ds.workPackages.filter((w) => w.contractId === contract?.id)

  if (!project || !contract) {
    return <p className="section-note">Project not found.</p>
  }

  const approvedChanges = changes.filter((c) => c.status === 'Approved').reduce((a, c) => a + c.signedValue, 0)
  const adjusted = Math.round((contract.originalValue + approvedChanges) * 100) / 100

  return (
    <article className="section">
      <header className="section-header">
        <label className="project-picker">
          Project
          <select value={projectId} onChange={(e) => onChangeProject(e.target.value)}>
            {ds.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </label>
        <h1>Contract &amp; Commercial</h1>
        <p className="section-description">
          Main contract, approved commercial changes and work packages with explicit delivery evidence.
        </p>
      </header>
      <div className="section-body">
        <dl className="contract-summary">
          <div className="kpi-card">
            <dt>Original Contract</dt>
            <dd>{formatSgd(contract.originalValue)}</dd>
          </div>
          <div className="kpi-card">
            <dt>Approved Changes</dt>
            <dd className={approvedChanges < 0 ? 'delta-neg' : 'delta-pos'}>{signed(approvedChanges)}</dd>
          </div>
          <div className="kpi-card">
            <dt>Adjusted Contract</dt>
            <dd>{formatSgd(adjusted)}</dd>
          </div>
          <div className="kpi-card">
            <dt>Contract Status</dt>
            <dd><StatusPill status={contract.status} /></dd>
          </div>
        </dl>

        <p className="revision-note" role="note">
          Certified and billed history is never silently overwritten — later changes appear as adjustment
          entries in this register (BR-CONTRACT-003).
        </p>

        <h2>Commercial Changes ({changes.length})</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Commercial changes for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Kind</th>
                <th scope="col">Description</th>
                <th scope="col" className="num">Signed Value</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.kind}</td>
                  <td>{c.description}</td>
                  <td className={'num ' + (c.signedValue < 0 ? 'delta-neg' : 'delta-pos')}>{signed(c.signedValue)}</td>
                  <td><StatusPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Work Packages ({workPackages.length})</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Work packages for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">WBS</th>
                <th scope="col">Trade</th>
                <th scope="col">Location</th>
                <th scope="col">Fulfilment</th>
                <th scope="col">Billing</th>
                <th scope="col">Evidence</th>
                <th scope="col" className="num">Value</th>
                <th scope="col" className="num">Claimed</th>
                <th scope="col" className="num">Certified</th>
                <th scope="col" className="num">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {workPackages.map((w) => (
                <tr key={w.id}>
                  <td>{w.code}</td>
                  <td>{w.wbs}</td>
                  <td>{w.trade}</td>
                  <td>{w.location}</td>
                  <td>{w.fulfilmentType}</td>
                  <td>{w.billingBasis}</td>
                  <td>
                    {w.doRequired ? (
                      <span className="do-pill">DO Required</span>
                    ) : (
                      <span className="progress-pill">Progress Measurement</span>
                    )}
                  </td>
                  <td className="num">{formatSgd(w.value)}</td>
                  <td className="num">{formatSgd(w.claimed)}</td>
                  <td className="num">{formatSgd(w.certified)}</td>
                  <td className="num">{formatSgd(w.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
