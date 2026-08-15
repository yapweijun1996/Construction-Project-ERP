/**
 * TASK-010b — Subcontracts (SPEC-007).
 *
 * Subcontract awards with their claim chain: subcon claim -> QS verification
 * -> subcon certificate -> AP. Claimed/certified are current-period
 * increments; verification can write claims down (subcon-overclaim hero),
 * hold them, or apply backcharge contras (negative certification).
 */

import { useMemo, useState } from 'react'
import { buildBaseline } from '../../data/baseline'
import { formatSgd } from '../../domain/kpis'
import StatusPill from '../../ui/StatusPill'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

export default function SubcontractsView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)
  const [subId, setSubId] = useState<string | null>(null)

  if (!project) return <p className="section-note">Project not found.</p>

  const partyName = new Map(ds.parties.map((p) => [p.id, p.name]))
  const subs = ds.subcontracts.filter((s) => s.projectId === projectId)
  const claimsBySub = new Map<string, typeof ds.subcontractClaims>()
  let totalCertified = 0
  for (const c of ds.subcontractClaims) {
    const sub = subs.find((s) => s.id === c.subcontractId)
    if (!sub) continue
    const list = claimsBySub.get(c.subcontractId) ?? []
    list.push(c)
    claimsBySub.set(c.subcontractId, list)
    if (c.certified > 0) totalCertified += c.certified
  }

  const active = subs.find((s) => s.id === subId) ?? null

  if (!active) {
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
          <h1>Subcontracts</h1>
          <p className="section-description">
            Subcontract awards and their claim chains. QS verification may write claims down or hold them.
          </p>
        </header>
        <div className="section-body">
          <dl className="contract-summary">
            <div className="kpi-card"><dt>Subcontracts</dt><dd className="kpi-small">{subs.length}</dd></div>
            <div className="kpi-card"><dt>Total Awarded</dt><dd>{formatSgd(subs.reduce((a, s) => a + s.originalValue, 0))}</dd></div>
            <div className="kpi-card"><dt>Certified to Date</dt><dd>{formatSgd(totalCertified)}</dd></div>
          </dl>

          <h2>Subcontract Awards ({subs.length})</h2>
          <div className="table-scroll">
            <table className="register-table">
              <caption className="visually-hidden">Subcontract awards for {project.code}</caption>
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Subcontractor</th>
                  <th scope="col" className="num">Award Value</th>
                  <th scope="col" className="num">Retention</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <button type="button" className="row-link" onClick={() => setSubId(s.id)}>
                        {s.code}
                      </button>
                    </td>
                    <td>{partyName.get(s.vendorId) ?? s.vendorId}</td>
                    <td className="num">{formatSgd(s.originalValue)}</td>
                    <td className="num">{s.retentionPct}%</td>
                    <td><StatusPill status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    )
  }

  const claims = claimsBySub.get(active.id) ?? []

  return (
    <article className="section">
      <header className="section-header">
        <button type="button" className="back-link" onClick={() => setSubId(null)}>
          ← Back to subcontracts
        </button>
        <h1>{active.code} <span className="claim-period">({partyName.get(active.vendorId) ?? active.vendorId})</span></h1>
        <p className="section-description">
          Award {formatSgd(active.originalValue)} · retention {active.retentionPct}% · claimed vs certified per
          claim.
        </p>
      </header>
      <div className="section-body">
        <h2>Subcontract Claims ({claims.length})</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Subcontract claims for {active.code}</caption>
            <thead>
              <tr>
                <th scope="col">Claim No</th>
                <th scope="col">Period</th>
                <th scope="col" className="num">Claimed</th>
                <th scope="col" className="num">Certified</th>
                <th scope="col" className="num">Difference</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const diff = Math.round((c.certified - c.claimed) * 100) / 100
                const negative = c.certified < 0
                return (
                  <tr key={c.id} className={negative ? 'row-negative' : undefined}>
                    <td>{c.claimNo}</td>
                    <td>{c.period}</td>
                    <td className="num">{formatSgd(c.claimed)}</td>
                    <td className={'num ' + (negative ? 'delta-neg' : '')}>{formatSgd(c.certified)}</td>
                    <td className={'num ' + (diff < 0 ? 'delta-neg' : '')}>{formatSgd(diff)}</td>
                    <td><StatusPill status={c.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {claims.some((c) => c.certified < c.claimed) && (
          <p className="section-note" role="status">
            <strong>QS verification:</strong> one or more claims were written down below the claimed amount —
            claimed and certified stay distinct (SPEC-007).
          </p>
        )}
        {claims.some((c) => c.certified < 0) && (
          <p className="section-note" role="status">
            <strong>Backcharge contra:</strong> a negative certification offsets prior over-certification.
          </p>
        )}
      </div>
    </article>
  )
}
