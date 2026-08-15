/**
 * TASK-006 — Progress measurement model (SPEC-004 groundwork).
 *
 * Monthly plan/actual progress measurements per project plus the latest
 * work-package progress derived from claim lines. Measurement types follow
 * the work-package fulfilment model (percentage/quantity/milestone and
 * physical-material DO steps are visible in the evidence column).
 */

import { useMemo } from 'react'
import { buildBaseline } from '../../data/baseline'
import { formatSgd } from '../../domain/kpis'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

export default function ProgressView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)

  if (!project) return <p className="section-note">Project not found.</p>

  const measurements = ds.progressMeasurements
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => (a.period === b.period ? (a.kind === 'plan' ? -1 : 1) : a.period < b.period ? 1 : -1))

  const actuals = measurements.filter((m) => m.kind === 'actual')
  const latestActual = actuals[0]
  const previousActual = actuals[1]
  const latestPlan = measurements.find((m) => m.kind === 'plan')
  const monthlyDelta = latestActual && previousActual ? Math.round((latestActual.cumulativePct - previousActual.cumulativePct) * 10) / 10 : null

  // latest claim line per work package (lines are generated in time order)
  const headerById = new Map(ds.claimHeaders.map((h) => [h.id, h]))
  const latestLineByWp = new Map<string, { pct: number; amount: number }>()
  for (const line of ds.claimLines) {
    const header = headerById.get(line.headerId)
    if (!header || header.projectId !== projectId) continue
    latestLineByWp.set(line.workPackageId, { pct: line.currentCumulativePct, amount: line.currentAmount })
  }
  const contract = ds.contracts.find((c) => c.projectId === projectId)
  const wps = ds.workPackages.filter((w) => w.contractId === contract?.id)

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
        <h1>Progress</h1>
        <p className="section-description">
          Monthly measured progress — plan versus actual — and the latest work-package progress.
        </p>
      </header>
      <div className="section-body">
        <dl className="contract-summary">
          <div className="kpi-card">
            <dt>Latest Actual</dt>
            <dd>{latestActual ? latestActual.cumulativePct.toFixed(1) + '%' : '—'}</dd>
          </div>
          <div className="kpi-card">
            <dt>Latest Plan</dt>
            <dd>{latestPlan ? latestPlan.cumulativePct.toFixed(1) + '%' : '—'}</dd>
          </div>
          <div className="kpi-card">
            <dt>Monthly Movement</dt>
            <dd className={monthlyDelta !== null && monthlyDelta < 0 ? 'delta-neg' : undefined}>
              {monthlyDelta !== null ? (monthlyDelta > 0 ? '+' : '') + monthlyDelta.toFixed(1) + '%' : '—'}
            </dd>
          </div>
          <div className="kpi-card">
            <dt>Latest Measurement</dt>
            <dd className="kpi-small">{latestActual ? latestActual.measuredAt : '—'}</dd>
          </div>
        </dl>

        <h2>Monthly Measurements ({measurements.length})</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Monthly progress measurements for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Kind</th>
                <th scope="col">Measured At</th>
                <th scope="col">Cumulative %</th>
                <th scope="col">Progress</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m) => (
                <tr key={m.id}>
                  <td>{m.period}</td>
                  <td>{m.kind === 'plan' ? 'Plan' : 'Actual'}</td>
                  <td>{m.measuredAt}</td>
                  <td className="num">{m.cumulativePct.toFixed(1)}%</td>
                  <td>
                    <progress max={100} value={m.cumulativePct} aria-label={'Progress ' + m.period + ' ' + m.kind}>
                      {m.cumulativePct.toFixed(1)}%
                    </progress>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Latest Work-Package Progress ({wps.length})</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Latest work-package progress for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Trade</th>
                <th scope="col">Evidence</th>
                <th scope="col" className="num">Current %</th>
                <th scope="col" className="num">Value</th>
                <th scope="col" className="num">Current Amount</th>
              </tr>
            </thead>
            <tbody>
              {wps.map((w) => {
                const latest = latestLineByWp.get(w.id)
                return (
                  <tr key={w.id}>
                    <td>{w.code}</td>
                    <td>{w.trade}</td>
                    <td>
                      {w.doRequired ? <span className="do-pill">DO Required</span> : <span className="progress-pill">Progress Measurement</span>}
                    </td>
                    <td className="num">{latest ? latest.pct.toFixed(1) + '%' : '0.0%'}</td>
                    <td className="num">{formatSgd(w.value)}</td>
                    <td className="num">{formatSgd(latest ? latest.amount : 0)}</td>
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
