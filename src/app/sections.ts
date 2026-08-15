export interface AppSection {
  id: string
  label: string
  shortLabel: string
  description: string
  task: string
}

// Project navigation per docs/03-design/DESIGN.md
export const SECTIONS: AppSection[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Home', description: 'Portfolio health: contract, work done, claim/cert progress, AR exposure and forecast.', task: 'TASK-004' },
  { id: 'contract-commercial', label: 'Contract & Commercial', shortLabel: 'Contract', description: 'Main contract, work packages, VO, omission and adjustment registers.', task: 'TASK-005' },
  { id: 'progress', label: 'Progress', shortLabel: 'Progress', description: 'Progress measurements and work-done evidence.', task: 'TASK-006' },
  { id: 'client-claims', label: 'Client Claims', shortLabel: 'Claims', description: 'PCAR wizard: current vs cumulative movement, negative claims highlighted.', task: 'TASK-007' },
  { id: 'certification', label: 'Certification', shortLabel: 'Certify', description: 'CCAR: submitted vs certified, holds and remarks.', task: 'TASK-008' },
  { id: 'procurement', label: 'Procurement', shortLabel: 'Procure', description: 'Purchase orders and supplier commitments.', task: 'TASK-010' },
  { id: 'subcontracts', label: 'Subcontracts', shortLabel: 'Subcon', description: 'Subcontract awards, subcon claims, certificates and AP.', task: 'TASK-010' },
  { id: 'cost-poc', label: 'Cost & POC', shortLabel: 'Cost', description: 'Budget, committed, actual, forecast, margin and accounting POC.', task: 'TASK-011' },
  { id: 'billing-ar', label: 'Billing & AR', shortLabel: 'Billing', description: 'Invoices, credit notes, receipts and allocations.', task: 'TASK-009' },
  { id: 'documents', label: 'Documents', shortLabel: 'Docs', description: 'Document register and revision control.', task: 'TASK-012' },
  { id: 'closeout', label: 'Closeout', shortLabel: 'Closeout', description: 'Practical completion, final account, retention release and DLP.', task: 'TASK-012' },
]

// Mobile bottom primary nav (docs/03-design/DESIGN-SYSTEM.md); 'more' opens the rest.
export const PRIMARY_SECTION_IDS: readonly string[] = ['overview', 'progress', 'client-claims', 'cost-poc', 'more']

export function sectionById(id: string): AppSection | undefined {
  return SECTIONS.find((s) => s.id === id)
}
