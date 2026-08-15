/**
 * TASK-008 — CCAR certification (SPEC-005).
 *
 * Records submitted vs certified without changing the original PCAR.
 * Full, partial, zero and negative certifications are supported with
 * explicit holds and remarks. Negative certification signals AR credit
 * intent (ADR-008). CCAR feeds the finance billing queue (TASK-009).
 */

import { useMemo, useState } from 'react'
import { buildBaseline } from '../../data/baseline'
import { formatSgd } from '../../domain/kpis'
import StatusPill from '../../ui/StatusPill'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

export default function CertificationView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)
  const [certId, setCertId] = useState<string | null>(null)

  if (!project) return <p className="section-note">Project not found.</p>

  const headerById = new Map(ds.claimHeaders.map((h) => [h.id, h]))
  const certs = ds.certifications.filter((c) => c.projectId === projectId)
  const sorted = [...certs].sort((a, b) => (headerById.get(a.claimId)?.period ?? '') < (headerById.get(b.claimId)?.period ?? '') ? 1 : -1)

  // per-certification increment against the previous cumulative certification
  const increments = new Map<string, number>()
  let prevCumulative = 0
  for (const c of [...sorted].reverse()) {
    const inc = Math.round((c.certifiedAmount - prevCumulative) * 100) / 100
    increments.set(c.id, inc)
    prevCumulative = c.certifiedAmount
  }

  const active = certs.find((c) => c.id === certId) ?? null

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
          <h1>Certification</h1>
          <p className="section-description">
            CCAR register — submitted versus certified. Full, partial, zero and negative certifications with
            holds and remarks.
          </p>
        </header>
        <div className="section-body">
          <h2>CCAR Register ({sorted.length})</h2>
          <div className="table-scroll">
            <table className="register-table">
              <caption className="visually-hidden">CCAR register for {project.code}</caption>
              <thead>
                <tr>
                  <th scope="col">Cert No</th>
                  <th scope="col">Period</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">Certified (Cumulative)</th>
                  <th scope="col" className="num">This Cert</th>
                  <th scope="col" className="num">On Hold</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => {
                  const header = headerById.get(c.claimId)
                  const inc = increments.get(c.id) ?? 0
                  return (
                    <tr key={c.id} className={inc < 0 ? 'row-negative' : undefined}>
                      <td>
                        <button type="button" className="row-link" onClick={() => setCertId(c.id)}>
                          {c.certNo}
                        </button>
                      </td>
                      <td>{header?.period ?? '—'}</td>
                      <td><StatusPill status={c.status} /></td>
                      <td className="num">{formatSgd(c.certifiedAmount)}</td>
                      <td className={'num ' + (inc < 0 ? 'delta-neg' : '')}>{formatSgd(inc)}</td>
                      <td className="num">{formatSgd(c.onHoldAmount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    )
  }

  const header = headerById.get(active.claimId)
  const inc = increments.get(active.id) ?? 0
  const isNegative = inc < 0

  return (
    <article className="section">
      <header className="section-header">
        <button type="button" className="back-link" onClick={() => setCertId(null)}>
          ← Back to CCAR register
        </button>
        <h1>{active.certNo} <span className="claim-period">({header?.period ?? '—'})</span></h1>
        <p className="section-description">
          Submitted claim {header?.claimNo ?? '—'} — this certificate records the certified position without
          changing the original PCAR.
        </p>
      </header>
      <div className="section-body">
        <h2>Submitted vs Certified</h2>
        <dl className={'contract-summary ' + (isNegative ? 'summary-negative' : '')}>
          <div className="kpi-card">
            <dt>Submitted (This Claim ex GST)</dt>
            <dd>{formatSgd(header?.thisClaimExGst ?? 0)}</dd>
          </div>
          <div className="kpi-card">
            <dt>Certified This Period</dt>
            <dd className={isNegative ? 'delta-neg' : 'delta-pos'}>{formatSgd(inc)}</dd>
          </div>
          <div className="kpi-card">
            <dt>Certified Cumulative</dt>
            <dd>{formatSgd(active.certifiedAmount)}</dd>
          </div>
          <div className="kpi-card">
            <dt>On Hold</dt>
            <dd>{formatSgd(active.onHoldAmount)}</dd>
          </div>
          <div className="kpi-card">
            <dt>Status</dt>
            <dd className="kpi-small"><StatusPill status={active.status} /></dd>
          </div>
        </dl>

        {active.remarks && (
          <p className="revision-note" role="note">
            <strong>Remarks:</strong> {active.remarks}
          </p>
        )}

        {isNegative && (
          <p className="section-note" role="status">
            <strong>Negative certification:</strong> the certified position is written down. In demo v1 this
            produces an explicit AR credit intent (ADR-008) — it is never deducted again inside the next PCAR
            (BR-AR-003).
          </p>
        )}
        {active.onHoldAmount > 0 && (
          <p className="section-note" role="status">
            <strong>Hold:</strong> {formatSgd(active.onHoldAmount)} is withheld pending supporting evidence.
          </p>
        )}

        <h2>Finance Queue</h2>
        <p className="section-note">
          This certificate feeds the billing queue — invoices and credit notes are issued from certifications
          in Billing &amp; AR (TASK-009).
        </p>
      </div>
    </article>
  )
}
