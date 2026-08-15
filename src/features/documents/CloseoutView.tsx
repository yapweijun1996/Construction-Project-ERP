/**
 * TASK-012b — Closeout (SPEC-009).
 *
 * Practical completion, final account, retention release, DLP, defect list,
 * final claim/cert and closed status — driven by the project lifecycle state.
 */

import { useMemo } from 'react'
import { buildBaseline } from '../../data/baseline'
import { formatSgd } from '../../domain/kpis'
import StatusPill from '../../ui/StatusPill'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

export default function CloseoutView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)

  if (!project) return <p className="section-note">Project not found.</p>

  const retentions = ds.retentions.filter((r) => r.projectId === projectId)
  const defects = ds.documents.filter((d) => d.projectId === projectId && d.category === 'defects')
  const finalAccounts = ds.documents.filter((d) => d.projectId === projectId && d.category === 'final-account')
  const headers = ds.claimHeaders.filter((h) => h.projectId === projectId).sort((a, b) => (a.period < b.period ? 1 : -1))
  const certs = ds.certifications.filter((c) => c.projectId === projectId)
  const finalClaim = headers[0]
  const finalCert = certs.length > 0 ? certs.reduce((a, b) => (a.certifiedAmount >= b.certifiedAmount ? a : b)) : undefined

  const closeoutNote = (() => {
    switch (project.status) {
      case 'Completed':
        return 'Practical completion achieved — project closed with final account issued.'
      case 'DLP':
        return 'In Defects Liability Period — retention pending release after defect closure.'
      case 'Final Account Dispute':
        return 'Final account in dispute — defects and final account documents tracked; retention withheld.'
      default:
        return 'Works in progress — closeout documents will accumulate toward practical completion.'
    }
  })()

  return (
    <article className="section">
      <header className="section-header">
        <label className="project-picker">
          Project
          <select value={projectId} onChange={(e) => onChangeProject(e.target.value)}>
            {ds.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
        </label>
        <h1>Closeout</h1>
        <p className="section-description">
          Practical completion, final account, retention release, DLP and defect status.
        </p>
      </header>
      <div className="section-body">
        <dl className="contract-summary">
          <div className="kpi-card"><dt>Project Status</dt><dd className="kpi-small"><StatusPill status={project.status} /></dd></div>
          <div className="kpi-card"><dt>Planned Completion</dt><dd className="kpi-small">{project.plannedCompletionDate}</dd></div>
          <div className="kpi-card"><dt>Final Claim</dt><dd className="kpi-small">{finalClaim ? finalClaim.claimNo + ' (' + finalClaim.period + ')' : '—'}</dd></div>
          <div className="kpi-card"><dt>Final Certificate</dt><dd className="kpi-small">{finalCert ? finalCert.certNo : '—'}</dd></div>
        </dl>

        <p className="revision-note" role="note">{closeoutNote}</p>

        <h2>Retention Status</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Retention status for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Kind</th>
                <th scope="col" className="num">Retained</th>
                <th scope="col" className="num">Released</th>
                <th scope="col" className="num">Outstanding</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {retentions.map((r) => (
                <tr key={r.id}>
                  <td>{r.kind === 'receivable' ? 'Receivable (client)' : 'Payable (subcontractors)'}</td>
                  <td className="num">{formatSgd(r.amount)}</td>
                  <td className="num">{formatSgd(r.releasedAmount)}</td>
                  <td className="num">{formatSgd(Math.round((r.amount - r.releasedAmount) * 100) / 100)}</td>
                  <td><StatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {defects.length > 0 && (
          <>
            <h2>Defect List ({defects.length})</h2>
            <ul className="doc-list" aria-label="Defect items">
              {defects.map((d) => (
                <li key={d.id}>
                  {d.docNo} — {d.title} (rev {d.revision}, {d.at})
                </li>
              ))}
            </ul>
          </>
        )}

        {finalAccounts.length > 0 && (
          <>
            <h2>Final Account ({finalAccounts.length})</h2>
            <ul className="doc-list" aria-label="Final account documents">
              {finalAccounts.map((d) => (
                <li key={d.id}>
                  {d.docNo} — {d.title} (rev {d.revision}, {d.at})
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </article>
  )
}
