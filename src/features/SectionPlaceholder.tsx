import type { AppSection } from '../app/sections'
import StatusPill from '../ui/StatusPill'
import { BUSINESS_STATUSES } from '../ui/statuses'

import { buildBaseline } from '../data/baseline'

export default function SectionPlaceholder({ section, projectId }: { section: AppSection; projectId?: string }) {
  const projectName = projectId ? buildBaseline().projects.find((p) => p.id === projectId)?.name : undefined
  return (
    <article className="section">
      <header className="section-header">
        <h1>{section.label}</h1>
        <p className="section-description">{section.description}</p>
      </header>
      <div className="section-body">
        <p className="section-note">
          {projectName ? (
            <>
              Selected project: <strong>{projectName}</strong>. This capability arrives in {section.task}.
            </>
          ) : (
            <>Open a project from Overview to start working here. This capability arrives in {section.task}.</>
          )}
        </p>
        {section.id === 'overview' && (
          <section aria-labelledby="status-heading" className="status-showcase">
            <h2 id="status-heading">Business status vocabulary (design-system baseline)</h2>
            <ul className="status-list" aria-label="Business statuses">
              {BUSINESS_STATUSES.map((s) => (
                <li key={s}>
                  <StatusPill status={s} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  )
}
