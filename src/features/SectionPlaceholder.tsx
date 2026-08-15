import type { AppSection } from '../app/sections'
import StatusPill from '../ui/StatusPill'
import { BUSINESS_STATUSES } from '../ui/statuses'

export default function SectionPlaceholder({ section }: { section: AppSection }) {
  return (
    <article className="section">
      <header className="section-header">
        <h1>{section.label}</h1>
        <p className="section-description">{section.description}</p>
      </header>
      <div className="section-body">
        <p className="section-note">
          This capability arrives in {section.task}. The current build is the TASK-001 app-shell
          scaffold; all demo data stays synthetic and local.
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
