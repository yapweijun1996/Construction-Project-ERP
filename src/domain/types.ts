/**
 * Domain entity types for the seed engine baseline.
 * Entities follow docs/02-architecture/DATA-MODEL.md; amounts are SGD with
 * cents precision (decimal-safe: integers of cents where exactness matters).
 */

export type EntityId = string
export type IsoDate = string // YYYY-MM-DD
export type Period = string // YYYY-MM

export type PartyType = 'client' | 'supplier' | 'subcontractor'

export interface Party {
  id: EntityId
  name: string
  type: PartyType
  fictional: boolean
  country: string
}

export type FulfilmentType =
  | 'physical-material'
  | 'progress-based-work'
  | 'lump-sum-work'
  | 'professional-service'
  | 'milestone'
  | 'commercial-adjustment'
  | 'omission'

export interface Project {
  id: EntityId
  code: string
  name: string
  projectType: string
  status: string
  startDate: IsoDate
  plannedCompletionDate: IsoDate
  originalContractValue: number
  currency: string
  gstRateAtAwardPct: number
  retentionPct: number
  clientId: EntityId
  scenarios: string[]
}

export interface Contract {
  id: EntityId
  projectId: EntityId
  code: string
  kind: string
  originalValue: number
  currency: string
  status: string
}

export interface WorkPackage {
  id: EntityId
  contractId: EntityId
  projectId: EntityId
  code: string
  description: string
  wbs: string
  trade: string
  location: string
  value: number
  fulfilmentType: FulfilmentType
  billingBasis: string
  doRequired: boolean
  claimed: number
  certified: number
  remaining: number
}

export type ChangeKind = 'VO' | 'Omission' | 'Adjustment' | 'Revised PO' | 'Backcharge'

export interface CommercialChange {
  id: EntityId
  contractId: EntityId
  projectId: EntityId
  code: string
  kind: ChangeKind
  description: string
  signedValue: number
  status: string
}

export interface ProgressMeasurement {
  id: EntityId
  projectId: EntityId
  period: Period
  measuredAt: IsoDate
  cumulativePct: number
}

export interface ClaimHeader {
  id: EntityId
  projectId: EntityId
  claimNo: string
  period: Period
  status: string
  currentCumulativeEntitlement: number
  previousCertified: number
  thisClaimExGst: number
  gstRatePct: number
  gst: number
  total: number
}

export interface ClaimLine {
  id: EntityId
  headerId: EntityId
  workPackageId: EntityId
  priorCumulativePct: number
  currentCumulativePct: number
  priorAmount: number
  currentAmount: number
  thisPeriodMovement: number
}

export interface Certification {
  id: EntityId
  projectId: EntityId
  claimId: EntityId
  certNo: string
  status: string
  certifiedAmount: number
  onHoldAmount: number
  remarks: string
}

export type ArKind = 'invoice' | 'credit-note'

export interface ArDocument {
  id: EntityId
  projectId: EntityId
  certId: EntityId
  docNo: string
  kind: ArKind
  amount: number
  gst: number
  total: number
  issuedAt: IsoDate
  status: string
}

export interface Receipt {
  id: EntityId
  projectId: EntityId
  arDocumentId: EntityId
  receiptNo: string
  receivedAt: IsoDate
  amount: number
}

export interface Allocation {
  id: EntityId
  projectId: EntityId
  receiptId: EntityId
  arDocumentId: EntityId
  creditDocumentId: EntityId | null
  amount: number
  allocatedAt: IsoDate
}

export interface PurchaseOrder {
  id: EntityId
  projectId: EntityId
  vendorId: EntityId
  poNo: string
  kind: 'po' | 'subcontract-award'
  issuedAt: IsoDate
  amount: number
  status: string
}

export interface Subcontract {
  id: EntityId
  projectId: EntityId
  vendorId: EntityId
  code: string
  originalValue: number
  retentionPct: number
  status: string
}

export interface SubcontractClaim {
  id: EntityId
  subcontractId: EntityId
  claimNo: string
  period: Period
  claimed: number
  certified: number
  status: string
}

export interface CostTransaction {
  id: EntityId
  projectId: EntityId
  category: string
  amount: number
  occurredAt: IsoDate
  source: string
}

export interface PocSnapshot {
  id: EntityId
  projectId: EntityId
  period: Period
  costPocPct: number
  physicalPct: number
  claimPct: number
  certPct: number
  collectedPct: number
}

export interface Retention {
  id: EntityId
  projectId: EntityId
  kind: 'receivable' | 'payable'
  amount: number
  releasedAmount: number
  status: string
}

export interface DocumentRecord {
  id: EntityId
  projectId: EntityId
  category: string
  docNo: string
  title: string
  revision: number
  at: IsoDate
}

export interface AuditEvent {
  id: EntityId
  projectId: EntityId
  at: IsoDate
  actor: string
  action: string
  entity: string
  entityId: EntityId
  note: string
}

export interface BaselineMeta {
  engineVersion: string
  seedVersion: string
  seed: number
}

export interface BaselineDataset {
  meta: BaselineMeta
  parties: Party[]
  projects: Project[]
  contracts: Contract[]
  workPackages: WorkPackage[]
  commercialChanges: CommercialChange[]
  progressMeasurements: ProgressMeasurement[]
  claimHeaders: ClaimHeader[]
  claimLines: ClaimLine[]
  certifications: Certification[]
  arDocuments: ArDocument[]
  receipts: Receipt[]
  allocations: Allocation[]
  purchaseOrders: PurchaseOrder[]
  subcontracts: Subcontract[]
  subcontractClaims: SubcontractClaim[]
  costTransactions: CostTransaction[]
  pocSnapshots: PocSnapshot[]
  retentions: Retention[]
  documents: DocumentRecord[]
  auditEvents: AuditEvent[]
}
