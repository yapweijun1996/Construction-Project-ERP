import { buildBaseline } from '../../data/baseline'
import { computeProjectKpis, formatSgd } from '../../domain/kpis'
import type { Project } from '../../domain/types'
import StatusPill from '../../ui/StatusPill'

interface Props {
  project: Project
  onBack: () => void
}

export default function ProjectWorkspaceView({ project, onBack }: Props) {
  const ds = buildBaseline()
  const k = computeProjectKpis(ds, project)
  const client = ds.parties.find((p) => p.id === project.clientId)

  const kpis: { label: string; value: string; hint?: string }[] = [
    { label: 'Original Contract', value: formatSgd(k.originalContract) },
    { label: 'Approved Changes', value: formatSgd(k.approvedChanges) },
    { label: 'Adjusted Contract', value: formatSgd(k.adjustedContract), hint: 'Original + approved changes' },
    { label: 'Work Done', value: formatSgd(k.workDone), hint: 'Cumulative entitlement' },
    { label: 'Claimed', value: formatSgd(k.claimed) },
    { label: 'Certified', value: formatSgd(k.certified), hint: 'Cumulative certified' },
    { label: 'Billed', value: formatSgd(k.billed) },
    { label: 'Collected', value: formatSgd(k.collected) },
    { label: 'AR Exposure', value: formatSgd(k.ar), hint: 'Billed + credits − collected' },
    { label: 'Budget', value: formatSgd(k.budget) },
    { label: 'Actual Cost', value: formatSgd(k.actual) },
    { label: 'Forecast Final Cost', value: formatSgd(k.forecast) },
    { label: 'POC (Cost)', value: k.poc.toFixed(1) + '%', hint: 'Accounting POC, not claim progress' },
    { label: 'Forecast Margin', value: k.marginPct.toFixed(1) + '%', hint: '(Adjusted − Forecast) / Adjusted' },
  ]

  return (
    <article className="section">
      <header className="section-header">
        <button type="button" className="back-link" onClick={onBack}>
          ← Back to portfolio
        </button>
        <h1>
          {project.code} — {project.name}
        </h1>
        <div className="workspace-meta">
          <StatusPill status={project.status} />
          <span>{project.projectType}</span>
          <span>{client?.name ?? project.clientId}</span>
          <span>
            {project.startDate} → {project.plannedCompletionDate}
          </span>
          <span>Retention {project.retentionPct}%</span>
        </div>
        <ul className="scenario-list" aria-label="Demo scenarios">
          {project.scenarios.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </header>
      <div className="section-body">
        <h2>Workspace KPIs</h2>
        <dl className="kpi-grid">
          {kpis.map((item) => (
            <div key={item.label} className="kpi-card">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
              {item.hint && <p className="kpi-hint">{item.hint}</p>}
            </div>
          ))}
        </dl>
        <p className="section-note">
          Detail registers (contract lines, claims, certification, AR, cost) arrive with TASK-005 onward.
        </p>
      </div>
    </article>
  )
}
