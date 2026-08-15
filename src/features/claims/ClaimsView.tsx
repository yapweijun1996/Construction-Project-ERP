/**
 * TASK-007 — PCAR wizard (SPEC-004).
 *
 * Read-only presentation of the generated claim cycle:
 *   Prelim -> Work Done -> Adjustments -> Review -> Submit.
 *
 * Work lines show prior/current cumulative %, prior/current amounts and the
 * current-period movement. The summary always shows Current Cumulative
 * Entitlement, Previous Certified, This Claim ex GST, GST and Total.
 * Negative current claims are valid and highlighted (BR-CLAIM-006).
 */

import { useMemo, useState } from 'react'
import { buildBaseline } from '../../data/baseline'
import { formatSgd } from '../../domain/kpis'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

const STEPS = ['Prelim', 'Work Done', 'Adjustments', 'Review', 'Submit'] as const

export default function ClaimsView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)
  const [claimId, setClaimId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  if (!project) return <p className="section-note">Project not found.</p>

  const headers = ds.claimHeaders.filter((h) => h.projectId === projectId).sort((a, b) => (a.period < b.period ? 1 : -1))
  const active = headers.find((h) => h.id === claimId) ?? null

  const openClaim = (id: string) => {
    setClaimId(id)
    setStepIndex(0)
  }

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
          <h1>Client Claims</h1>
          <p className="section-description">
            Progress claims (PCAR). Open a claim to review it step by step — negative current claims are valid
            and highlighted.
          </p>
        </header>
        <div className="section-body">
          <h2>PCAR Register ({headers.length})</h2>
          <div className="table-scroll">
            <table className="register-table">
              <caption className="visually-hidden">PCAR register for {project.code}</caption>
              <thead>
                <tr>
                  <th scope="col">Claim No</th>
                  <th scope="col">Period</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">This Claim ex GST</th>
                  <th scope="col" className="num">GST %</th>
                  <th scope="col" className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h) => (
                  <tr key={h.id} className={h.thisClaimExGst < 0 ? 'row-negative' : undefined}>
                    <td>
                      <button type="button" className="row-link" onClick={() => openClaim(h.id)}>
                        {h.claimNo}
                      </button>
                    </td>
                    <td>{h.period}</td>
                    <td>{h.status}</td>
                    <td className={'num ' + (h.thisClaimExGst < 0 ? 'delta-neg' : '')}>
                      {h.thisClaimExGst < 0 ? '−' + formatSgd(Math.abs(h.thisClaimExGst)) : formatSgd(h.thisClaimExGst)}
                    </td>
                    <td className="num">{h.gstRatePct}%</td>
                    <td className={'num ' + (h.total < 0 ? 'delta-neg' : '')}>{formatSgd(h.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    )
  }

  const lines = ds.claimLines.filter((l) => l.headerId === active.id)
  const wpsById = new Map(ds.workPackages.map((w) => [w.id, w]))
  const isNegative = active.thisClaimExGst < 0

  return (
    <article className="section">
      <header className="section-header">
        <button type="button" className="back-link" onClick={() => setClaimId(null)}>
          ← Back to PCAR register
        </button>
        <h1>
          {active.claimNo} <span className="claim-period">({active.period})</span>
        </h1>
        <p className="section-description">
          Review the claim step by step. {isNegative ? 'This claim contains a negative current movement — it is valid and highlighted (BR-CLAIM-006).' : 'Current-period movement vs previous certification.'}
        </p>
      </header>
      <nav className="stepper" aria-label="PCAR review steps">
        <ol>
          {STEPS.map((step, i) => (
            <li key={step} className={i === stepIndex ? 'step-active' : i < stepIndex ? 'step-done' : undefined} aria-current={i === stepIndex ? 'step' : undefined}>
              <button type="button" onClick={() => setStepIndex(i)} disabled={i === stepIndex}>
                {i + 1}. {step}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="section-body">
        {stepIndex === 0 && (
          <section aria-labelledby="step-prelim">
            <h2 id="step-prelim">Prelim</h2>
            <dl className="contract-summary">
              <div className="kpi-card"><dt>Project</dt><dd className="kpi-small">{project.code} — {project.name}</dd></div>
              <div className="kpi-card"><dt>Period</dt><dd className="kpi-small">{active.period}</dd></div>
              <div className="kpi-card"><dt>GST Rate</dt><dd className="kpi-small">{active.gstRatePct}%</dd></div>
              <div className="kpi-card"><dt>Retention</dt><dd className="kpi-small">{active.retentionPct}%</dd></div>
            </dl>
          </section>
        )}

        {stepIndex === 1 && (
          <section aria-labelledby="step-workdone">
            <h2 id="step-workdone">Work Done ({lines.length} lines)</h2>
            <div className="table-scroll">
              <table className="register-table">
                <caption className="visually-hidden">Work lines for {active.claimNo}</caption>
                <thead>
                  <tr>
                    <th scope="col">WP</th>
                    <th scope="col">Trade</th>
                    <th scope="col" className="num">Prior %</th>
                    <th scope="col" className="num">Current %</th>
                    <th scope="col" className="num">Prior Amount</th>
                    <th scope="col" className="num">Current Amount</th>
                    <th scope="col" className="num">Movement</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const wp = wpsById.get(l.workPackageId)
                    const negative = l.thisPeriodMovement < 0
                    return (
                      <tr key={l.id} className={negative ? 'row-negative' : undefined}>
                        <td>{wp?.code ?? l.workPackageId}</td>
                        <td>{wp?.trade ?? '—'}</td>
                        <td className="num">{l.priorCumulativePct.toFixed(1)}%</td>
                        <td className="num">{l.currentCumulativePct.toFixed(1)}%</td>
                        <td className="num">{formatSgd(l.priorAmount)}</td>
                        <td className="num">{formatSgd(l.currentAmount)}</td>
                        <td className={'num ' + (negative ? 'delta-neg' : '')}>{formatSgd(l.thisPeriodMovement)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {stepIndex === 2 && (
          <section aria-labelledby="step-adjustments">
            <h2 id="step-adjustments">Adjustments</h2>
            <dl className="contract-summary">
              <div className="kpi-card">
                <dt>Retention</dt>
                <dd className="kpi-small">{formatSgd(active.retentionAmount)} <span className="kpi-hint">({active.retentionPct}% of claim)</span></dd>
              </div>
              <div className="kpi-card">
                <dt>Advance Recovery</dt>
                <dd className="kpi-small">{formatSgd(active.advanceRecovery)}</dd>
              </div>
              <div className="kpi-card">
                <dt>Previous Certified</dt>
                <dd className="kpi-small">{formatSgd(active.previousCertified)}</dd>
              </div>
            </dl>
            <p className="revision-note" role="note">
              Retention, on-hold and advance recovery are explicit claim fields (BR-CLAIM-005); certification
              history is never overwritten — corrections appear as adjustment movements.
            </p>
          </section>
        )}

        {stepIndex === 3 && (
          <section aria-labelledby="step-review">
            <h2 id="step-review">Review</h2>
            <dl className={'contract-summary ' + (isNegative ? 'summary-negative' : '')}>
              <div className="kpi-card"><dt>Current Cumulative Entitlement</dt><dd>{formatSgd(active.currentCumulativeEntitlement)}</dd></div>
              <div className="kpi-card"><dt>Previous Certified</dt><dd>{formatSgd(active.previousCertified)}</dd></div>
              <div className="kpi-card"><dt>This Claim ex GST</dt><dd className={isNegative ? 'delta-neg' : 'delta-pos'}>{isNegative ? '−' + formatSgd(Math.abs(active.thisClaimExGst)) : formatSgd(active.thisClaimExGst)}</dd></div>
              <div className="kpi-card"><dt>GST ({active.gstRatePct}%)</dt><dd className={active.gst < 0 ? 'delta-neg' : undefined}>{formatSgd(active.gst)}</dd></div>
              <div className="kpi-card"><dt>Total</dt><dd className={active.total < 0 ? 'delta-neg' : undefined}>{formatSgd(active.total)}</dd></div>
            </dl>
            {isNegative && (
              <p className="section-note" role="status">
                <strong>Negative claim:</strong> cumulative entitlement fell below previous certification. This is a
                valid current-period movement (BR-CLAIM-006) and will produce an AR credit intent at certification.
              </p>
            )}
          </section>
        )}

        {stepIndex === 4 && (
          <section aria-labelledby="step-submit">
            <h2 id="step-submit">Submit</h2>
            <dl className="contract-summary">
              <div className="kpi-card"><dt>Status</dt><dd className="kpi-small">{active.status}</dd></div>
              <div className="kpi-card"><dt>Period</dt><dd className="kpi-small">{active.period}</dd></div>
            </dl>
            <p className="section-note">
              This demo presents the deterministic baseline read-only: submitted claims are seeded data, not
              live entries. Interactive claim capture belongs to a future backlog item.
            </p>
          </section>
        )}

        <div className="stepper-actions">
          <button type="button" className="step-button" onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={stepIndex === 0}>
            ← Previous
          </button>
          <button type="button" className="step-button" onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))} disabled={stepIndex === STEPS.length - 1}>
            Next →
          </button>
        </div>
      </div>
    </article>
  )
}
