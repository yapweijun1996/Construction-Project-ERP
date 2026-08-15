import { useEffect, useState } from 'react'
import AppShell from './AppShell'
import { SECTIONS, sectionById } from './sections'
import SectionPlaceholder from '../features/SectionPlaceholder'
import PortfolioView from '../features/portfolio/PortfolioView'
import ContractCommercialView from '../features/contracts/ContractCommercialView'
import ProgressView from '../features/progress/ProgressView'

function readHashSection(): string {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return sectionById(raw) ? raw : SECTIONS[0].id
}

export default function App() {
  const [activeId, setActiveId] = useState<string>(readHashSection)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  useEffect(() => {
    const onHashChange = () => setActiveId(readHashSection())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const active = sectionById(activeId) ?? SECTIONS[0]

  const content = (() => {
    if (active.id === 'overview') return <PortfolioView onOpenProject={setCurrentProjectId} />
    if (active.id === 'contract-commercial' && currentProjectId) {
      return <ContractCommercialView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'progress' && currentProjectId) {
      return <ProgressView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    return <SectionPlaceholder section={active} projectId={currentProjectId ?? undefined} />
  })()

  return (
    <AppShell sections={SECTIONS} activeId={active.id}>
      {content}
    </AppShell>
  )
}
