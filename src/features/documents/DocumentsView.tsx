/**
 * TASK-012a — Documents register (SPEC-009).
 *
 * Categories: contract/PO/VO/claim/cert/invoice/drawings/site evidence/
 * correspondence/defects/final account.
 */

import { useMemo, useState } from 'react'
import { buildBaseline } from '../../data/baseline'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

export default function DocumentsView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)
  const [category, setCategory] = useState('all')

  if (!project) return <p className="section-note">Project not found.</p>

  const docs = ds.documents.filter((d) => d.projectId === projectId)
  const categories = [...new Set(docs.map((d) => d.category))].sort()
  const filtered = category === 'all' ? docs : docs.filter((d) => d.category === category)
  const revisions = docs.reduce((a, d) => a + d.revision, 0)

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
        <h1>Documents</h1>
        <p className="section-description">
          Document register across the project lifecycle — revisions kept visible.
        </p>
      </header>
      <div className="section-body">
        <dl className="contract-summary">
          <div className="kpi-card"><dt>Documents</dt><dd className="kpi-small">{docs.length}</dd></div>
          <div className="kpi-card"><dt>Revisions</dt><dd className="kpi-small">{revisions}</dd></div>
          <div className="kpi-card"><dt>Categories</dt><dd className="kpi-small">{categories.length}</dd></div>
        </dl>

        <div className="filters" role="group" aria-label="Document filters">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <h2>Document Register ({filtered.length})</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Document register for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Doc No</th>
                <th scope="col">Category</th>
                <th scope="col">Title</th>
                <th scope="col" className="num">Rev</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.docNo}</td>
                  <td>{d.category}</td>
                  <td>{d.title}</td>
                  <td className="num">{d.revision}</td>
                  <td>{d.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
