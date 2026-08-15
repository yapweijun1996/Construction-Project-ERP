import { useEffect, useState, type ReactNode } from 'react'
import { PRIMARY_SECTION_IDS, type AppSection } from './sections'
import SettingsDialog from '../features/settings/SettingsDialog'

interface AppShellProps {
  sections: AppSection[]
  activeId: string
  children: ReactNode
}

export default function AppShell({ sections, activeId, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Close overlays on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false)
        setMoreOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 'more' is a virtual bottom-nav entry (opens the secondary sheet), so it
  // is rendered explicitly below rather than filtered from sections.
  const primary = sections.filter((s) => PRIMARY_SECTION_IDS.includes(s.id))
  const secondary = sections.filter((s) => !PRIMARY_SECTION_IDS.includes(s.id) && s.id !== 'more')

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <span aria-hidden="true">☰</span> Menu
        </button>
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-title">Construction Project ERP</span>
        <button
          type="button"
          className="settings-toggle"
          aria-haspopup="dialog"
          onClick={() => setSettingsOpen(true)}
        >
          Settings
        </button>
      </header>
      <div className="app-layout">
        <aside
          id="app-sidebar"
          className={'app-sidebar' + (drawerOpen ? ' drawer-open' : '')}
          aria-label="Primary navigation"
        >
          <nav aria-label="Sections">
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={'#' + s.id} aria-current={s.id === activeId ? 'page' : undefined}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        {drawerOpen && (
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <main id="main-content" className="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <nav className="app-bottom-nav" aria-label="Primary navigation (mobile)">
        {primary.map((s) => (
          <a
            key={s.id}
            href={'#' + s.id}
            aria-current={s.id === activeId ? 'page' : undefined}
          >
            {s.shortLabel}
          </a>
        ))}
        <button
          type="button"
          className="bottom-nav-item bottom-nav-more"
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          onClick={() => setMoreOpen(true)}
        >
          <span aria-hidden="true">•••</span> More
        </button>
      </nav>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {moreOpen && (
        <div className="sheet-stack">
          <button
            type="button"
            className="sheet-backdrop"
            aria-label="Close more sections"
            onClick={() => setMoreOpen(false)}
          />
          <div className="app-sheet" role="dialog" aria-modal="true" aria-label="More sections">
            <h2>More sections</h2>
            <ul>
              {secondary.map((s) => (
                <li key={s.id}>
                  <a href={'#' + s.id} aria-current={s.id === activeId ? 'page' : undefined}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <button type="button" className="sheet-close" onClick={() => setMoreOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
