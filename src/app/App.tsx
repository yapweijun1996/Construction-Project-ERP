import { useEffect, useState } from 'react'
import AppShell from './AppShell'
import { SECTIONS, sectionById } from './sections'
import SectionPlaceholder from '../features/SectionPlaceholder'
import PortfolioView from '../features/portfolio/PortfolioView'

function readHashSection(): string {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return sectionById(raw) ? raw : SECTIONS[0].id
}

export default function App() {
  const [activeId, setActiveId] = useState<string>(readHashSection)

  useEffect(() => {
    const onHashChange = () => setActiveId(readHashSection())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const active = sectionById(activeId) ?? SECTIONS[0]

  const content = active.id === 'overview' ? <PortfolioView /> : <SectionPlaceholder section={active} />

  return (
    <AppShell sections={SECTIONS} activeId={active.id}>
      {content}
    </AppShell>
  )
}
