/**
 * TASK-011 — Cost & POC dashboard (SPEC-008).
 *
 * Original/Revised budget, committed, actual, forecast final cost, cost to
 * complete, variance, recognised revenue, gross profit and cost-based POC.
 * Physical, claim, certification, POC and cash collection are shown as
 * distinct measures (BR-COST-001: claim progress != accounting POC).
 */

import { useMemo } from 'react'
import { buildBaseline } from '../../data/baseline'
import { computeProjectKpis, formatSgd } from '../../domain/kpis'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

const CATEGORIES = ['labour', 'material', 'equipment', 'subcontract', 'site-overheads', 'consultant'] as const

export default function CostPocView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)

  if (!project) return <p className="section-note">Project not found.</p>

  const k = computeProjectKpis(ds, project)
  const snaps = ds.pocSnapshots
    .filter((s) => s.projectId === projectId && s.kind === 'actual')
    .sort((a, b) => (a.period < b.period ? 1 : -1))
  const latest = snaps[0]
  const costs = ds.costTransactions.filter((t) => t.projectId === projectId)
  const byCategory = new Map<string, number>()
  for (const t of costs) byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount)
  const overrun = k.variance < 0

  const costKpis = [
    { label: 'Original Budget', value: formatSgd(k.budget) },
    { label: 'Revised Budget', value: formatSgd(k.revisedBudget), hint: 'Original + approved changes' },
    { label: 'Committed', value: formatSgd(k.committed), hint: 'Purchase/subcontract orders' },
    { label: 'Actual Cost', value: formatSgd(k.actual) },
    { label: 'Forecast Final Cost', value: formatSgd(k.forecast) },
    { label: 'Cost To Complete', value: formatSgd(k.costToComplete) },
    { label: 'Variance', value: formatSgd(k.variance), hint: 'Revised budget − forecast', neg: k.variance < 0 },
    { label: 'Recognised Revenue', value: formatSgd(k.recognizedRevenue), hint: 'Adjusted × cost POC' },
    { label: 'Gross Profit', value: formatSgd(k.grossProfit), neg: k.grossProfit < 0 },
    { label: 'Margin', value: k.marginPct.toFixed(1) + '%', neg: k.marginPct < 0 },
    { label: 'POC (Cost)', value: k.poc.toFixed(1) + '%' },
    { label: 'Cost Transactions', value: String(costs.length) },
  ]

  const measures = latest
    ? [
        { label: 'Physical Progress', value: latest.physicalPct.toFixed(1) + '%' },
        { label: 'Claim Progress', value: latest.claimPct.toFixed(1) + '%' },
        { label: 'Certification Progress', value: latest.certPct.toFixed(1) + '%' },
        { label: 'Cost POC', value: latest.costPocPct.toFixed(1) + '%' },
        { label: 'Cash Collection', value: latest.collectedPct.toFixed(1) + '%' },
      ]
    : []

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
        <h1>Cost &amp; POC</h1>
        <p className="section-description">
          Budget, committed, actual and forecast with five distinct progress measures.
        </p>
      </header>
      <div className="section-body">
        {overrun && (
          <p className="section-note" role="status">
            <strong>Forecast overrun:</strong> forecast final cost exceeds the revised budget by{' '}
            {formatSgd(Math.abs(k.variance))}.
          </p>
        )}

        <h2>Cost Position</h2>
        <dl className="kpi-grid">
          {costKpis.map((item) => (
            <div key={item.label} className="kpi-card">
              <dt>{item.label}</dt>
              <dd className={item.neg ? 'delta-neg' : undefined}>{item.value}</dd>
              {item.hint && <p className="kpi-hint">{item.hint}</p>}
            </div>
          ))}
        </dl>

        <h2>Distinct Progress Measures</h2>
        <dl className="contract-summary">
          {measures.map((m) => (
            <div key={m.label} className="kpi-card">
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
        <p className="revision-note" role="note">
          Claim progress and accounting POC are separate measures (BR-COST-001) — physical, claim,
          certification, cost POC and cash collection never merge.
        </p>

        <h2>Cost by Category</h2>
        <dl className="contract-summary">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="kpi-card">
              <dt>{cat}</dt>
              <dd>{formatSgd(byCategory.get(cat) ?? 0)}</dd>
            </div>
          ))}
        </dl>

        <h2>POC Trend ({snaps.length} snapshots)</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">POC trend for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col" className="num">Cost POC</th>
                <th scope="col" className="num">Physical</th>
                <th scope="col" className="num">Claim</th>
                <th scope="col" className="num">Cert</th>
                <th scope="col" className="num">Collected</th>
                <th scope="col" className="num">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {snaps.map((s) => (
                <tr key={s.id}>
                  <td>{s.period}</td>
                  <td className="num">{s.costPocPct.toFixed(1)}%</td>
                  <td className="num">{s.physicalPct.toFixed(1)}%</td>
                  <td className="num">{s.claimPct.toFixed(1)}%</td>
                  <td className="num">{s.certPct.toFixed(1)}%</td>
                  <td className="num">{s.collectedPct.toFixed(1)}%</td>
                  <td className="num">{formatSgd(s.forecastFinalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
