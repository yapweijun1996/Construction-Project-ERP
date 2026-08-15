import { useEffect, useState } from 'react'
import AppShell from './AppShell'
import { SECTIONS, sectionById } from './sections'
import SectionPlaceholder from '../features/SectionPlaceholder'
import PortfolioView from '../features/portfolio/PortfolioView'
import ContractCommercialView from '../features/contracts/ContractCommercialView'
import ProgressView from '../features/progress/ProgressView'
import ClaimsView from '../features/claims/ClaimsView'
import CertificationView from '../features/certification/CertificationView'
import BillingArView from '../features/billing/BillingArView'
import ProcurementView from '../features/procurement/ProcurementView'
import SubcontractsView from '../features/procurement/SubcontractsView'
import CostPocView from '../features/cost/CostPocView'
import DocumentsView from '../features/documents/DocumentsView'
import CloseoutView from '../features/documents/CloseoutView'

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
    if (active.id === 'client-claims' && currentProjectId) {
      return <ClaimsView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'certification' && currentProjectId) {
      return <CertificationView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'billing-ar' && currentProjectId) {
      return <BillingArView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'procurement' && currentProjectId) {
      return <ProcurementView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'subcontracts' && currentProjectId) {
      return <SubcontractsView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'cost-poc' && currentProjectId) {
      return <CostPocView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'documents' && currentProjectId) {
      return <DocumentsView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    if (active.id === 'closeout' && currentProjectId) {
      return <CloseoutView projectId={currentProjectId} onChangeProject={setCurrentProjectId} />
    }
    return <SectionPlaceholder section={active} projectId={currentProjectId ?? undefined} />
  })()

  return (
    <AppShell sections={SECTIONS} activeId={active.id}>
      {content}
    </AppShell>
  )
}
