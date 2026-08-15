import { useEffect, useState } from 'react'
import AppShell from './AppShell'
import { SECTIONS, sectionById } from './sections'
import SectionPlaceholder from '../features/SectionPlaceholder'

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

  return (
    <AppShell sections={SECTIONS} activeId={active.id}>
      <SectionPlaceholder section={active} />
    </AppShell>
  )
}
