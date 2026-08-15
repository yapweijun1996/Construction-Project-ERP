import { useMemo, useState } from 'react'
import { buildBaseline } from '../../data/baseline'
import { computeProjectKpis, formatSgd } from '../../domain/kpis'
import type { Project } from '../../domain/types'
import StatusPill from '../../ui/StatusPill'
import { BUSINESS_STATUSES } from '../../ui/statuses'
import ProjectWorkspaceView from './ProjectWorkspaceView'

const VALUE_BANDS = [
  { id: 'all', label: 'All values' },
  { id: 'lt5m', label: '< S$5M' },
  { id: '5-20m', label: 'S$5M – 20M' },
  { id: '20-50m', label: 'S$20M – 50M' },
  { id: 'gte50m', label: '≥ S$50M' },
] as const

function valueBandOf(value: number): string {
  if (value < 5_000_000) return 'lt5m'
  if (value < 20_000_000) return '5-20m'
  if (value < 50_000_000) return '20-50m'
  return 'gte50m'
}

interface Filters {
  status: string
  year: string
  type: string
  client: string
  scenario: string
  band: string
}

const EMPTY_FILTERS: Filters = { status: 'all', year: 'all', type: 'all', client: 'all', scenario: 'all', band: 'all' }

interface Props {
  onOpenProject?: (projectId: string) => void
}

export default function PortfolioView({ onOpenProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const projects: { project: Project; kpis: ReturnType<typeof computeProjectKpis>; client: string }[] = []
    for (const project of ds.projects) {
      const k = computeProjectKpis(ds, project)
      const client = ds.parties.find((p) => p.id === project.clientId)?.name ?? project.clientId
      projects.push({ project, kpis: k, client })
    }
    return projects.filter(({ project, kpis }) => {
      if (filters.status !== 'all' && project.status !== filters.status) return false
      if (filters.year !== 'all' && project.startDate.slice(0, 4) !== filters.year) return false
      if (filters.type !== 'all' && project.projectType !== filters.type) return false
      if (filters.client !== 'all' && project.clientId !== filters.client) return false
      if (filters.scenario !== 'all' && !project.scenarios.includes(filters.scenario)) return false
      if (filters.band !== 'all' && valueBandOf(kpis.adjustedContract) !== filters.band) return false
      return true
    })
  }, [ds, filters])

  const openProject = (id: string) => {
    setSelectedId(id)
    onOpenProject?.(id)
  }

  if (selectedId) {
    const project = ds.projects.find((p) => p.id === selectedId)
    if (project) return <ProjectWorkspaceView project={project} onBack={() => setSelectedId(null)} />
  }

  const statuses = [...new Set(ds.projects.map((p) => p.status))].sort()
  const years = [...new Set(ds.projects.map((p) => p.startDate.slice(0, 4)))].sort()
  const types = [...new Set(ds.projects.map((p) => p.projectType))].sort()
  const clients = ds.parties
    .filter((p) => p.type === 'client')
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const scenarios = [
    ...new Set(
      ds.projects.flatMap((p) => p.scenarios).filter((s) => ['healthy', 'vo-heavy', 'cost-overrun', 'negative-claim', 'certification-gap', 'retention-heavy', 'late-ar', 'subcon-overclaim', 'physical-material-with-do', 'progress-work-no-do', 'on-hold', 'final-account-dispute'].includes(s)),
    ),
  ].sort()

  const update = (key: keyof Filters, value: string) => setFilters((f) => ({ ...f, [key]: value }))

  return (
    <article className="section">
      <header className="section-header">
        <h1>Overview</h1>
        <p className="section-description">
          Thirty synthetic Singapore projects, 2022–2026. Open any project for its commercial workspace.
        </p>
      </header>
      <div className="section-body">
        <div className="filters" role="group" aria-label="Portfolio filters">
          <label>
            Status
            <select value={filters.status} onChange={(e) => update('status', e.target.value)}>
              <option value="all">All</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Year
            <select value={filters.year} onChange={(e) => update('year', e.target.value)}>
              <option value="all">All</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={filters.type} onChange={(e) => update('type', e.target.value)}>
              <option value="all">All</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Client
            <select value={filters.client} onChange={(e) => update('client', e.target.value)}>
              <option value="all">All</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Scenario
            <select value={filters.scenario} onChange={(e) => update('scenario', e.target.value)}>
              <option value="all">All</option>
              {scenarios.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Value band
            <select value={filters.band} onChange={(e) => update('band', e.target.value)}>
              {VALUE_BANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </label>
        </div>

        <table className="portfolio-table">
          <caption>
            Project portfolio — {rows.length} of {ds.projects.length} projects
          </caption>
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Project</th>
              <th scope="col">Client</th>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col" className="num">Adjusted</th>
              <th scope="col" className="num">Work Done</th>
              <th scope="col" className="num">Certified</th>
              <th scope="col" className="num">AR</th>
              <th scope="col" className="num">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, kpis, client }) => (
              <tr key={project.id}>
                <td>
                  <button type="button" className="row-link" onClick={() => openProject(project.id)}>
                    {project.code}
                  </button>
                </td>
                <td>{project.name}</td>
                <td>{client}</td>
                <td>{project.projectType}</td>
                <td><StatusPill status={project.status} /></td>
                <td className="num">{formatSgd(kpis.adjustedContract)}</td>
                <td className="num">{formatSgd(kpis.workDone)}</td>
                <td className="num">{formatSgd(kpis.certified)}</td>
                <td className="num">{formatSgd(kpis.ar)}</td>
                <td className="num">{kpis.marginPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="section-note" role="status">No projects match the current filters.</p>
        )}

        <section aria-labelledby="status-heading" className="status-showcase">
          <h2 id="status-heading">Business status vocabulary (design-system baseline)</h2>
          <ul className="status-list" aria-label="Business statuses">
            {BUSINESS_STATUSES.map((s) => (
              <li key={s}><StatusPill status={s} /></li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
