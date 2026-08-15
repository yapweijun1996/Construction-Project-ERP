/**
 * TASK-003 Part 4c — document register and audit trail.
 *
 * SPEC-009 document categories: contract/PO/VO/claim/cert/invoice/drawings/
 * site evidence/correspondence/defects/final account. Documents derive from
 * generated entities plus monthly site records; every business action leaves
 * an audit event (SPEC-001: 3,000+ audit events).
 */

import type {
  ArDocument,
  AuditEvent,
  Certification,
  ClaimHeader,
  CommercialChange,
  Contract,
  DocumentRecord,
  Project,
  PurchaseOrder,
  Receipt,
  Retention,
  Subcontract,
  SubcontractClaim,
} from '../../types'
import type { SeedConfig } from '../config'
import { Random } from '../prng'

export interface DocsOutput {
  documents: DocumentRecord[]
  auditEvents: AuditEvent[]
}

const MONTHLY_CATEGORIES = ['drawings', 'site-evidence', 'correspondence'] as const

export function generateDocumentsAndAudit(
  config: SeedConfig,
  projects: Project[],
  contracts: Contract[],
  commercialChanges: CommercialChange[],
  claimHeaders: ClaimHeader[],
  certifications: Certification[],
  arDocuments: ArDocument[],
  receipts: Receipt[],
  purchaseOrders: PurchaseOrder[],
  subcontracts: Subcontract[],
  subcontractClaims: SubcontractClaim[],
  retentions: Retention[],
  rng: Random,
): DocsOutput {
  void config
  const documents: DocumentRecord[] = []
  const auditEvents: AuditEvent[] = []
  let docSeq = 0
  let auditSeq = 0

  const pushDoc = (projectId: string, category: string, title: string, at: string, revision = 1) => {
    docSeq += 1
    documents.push({
      id: 'doc-' + String(docSeq).padStart(5, '0'),
      projectId,
      category,
      docNo: category.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 3) + '-' + String(docSeq).padStart(4, '0'),
      title,
      revision,
      at,
    })
  }
  const pushAudit = (projectId: string, at: string, actor: string, action: string, entity: string, entityId: string, note: string) => {
    auditSeq += 1
    auditEvents.push({
      id: 'aud-' + String(auditSeq).padStart(5, '0'),
      projectId,
      at,
      actor,
      action,
      entity,
      entityId,
      note,
    })
  }

  const headerById = new Map(claimHeaders.map((h) => [h.id, h]))

  for (const project of projects) {
    pushAudit(project.id, project.startDate, 'Project Manager', 'created', 'project', project.id, 'Project registered')
    pushDoc(project.id, 'contract', 'Main contract ' + project.code, project.startDate)
  }
  for (const c of contracts) {
    const p = projects.find((x) => x.id === c.projectId)!
    pushDoc(c.projectId, 'contract', 'Contract award ' + c.code, p.startDate)
    pushAudit(c.projectId, p.startDate, 'QS/Commercial', 'awarded', 'contract', c.id, 'Main contract awarded')
  }
  for (const ch of commercialChanges) {
    const h = claimHeaders.find((x) => x.projectId === ch.projectId)
    const at = h ? h.period + '-15' : projects.find((x) => x.id === ch.projectId)!.startDate
    pushDoc(ch.projectId, 'VO', ch.kind + ' ' + ch.code + ' — ' + ch.description, at)
    pushAudit(ch.projectId, at, 'QS/Commercial', 'registered', 'commercial-change', ch.id, ch.kind + ' ' + (ch.status === 'Pending' ? 'pending' : 'approved'))
  }
  for (const h of claimHeaders) {
    pushDoc(h.projectId, 'claim', 'Progress claim ' + h.claimNo, h.period + '-28')
    pushAudit(h.projectId, h.period + '-28', 'QS/Commercial', 'submitted', 'pcar', h.id, 'PCAR submitted')
  }
  for (const c of certifications) {
    const h = headerById.get(c.claimId)
    const at = h ? h.period + '-28' : projects.find((x) => x.id === c.projectId)!.startDate
    pushDoc(c.projectId, 'cert', 'Certificate ' + c.certNo, at)
    pushAudit(c.projectId, at, 'QS/Commercial', 'certified', 'ccar', c.id, 'Certified: ' + c.status)
  }
  for (const d of arDocuments) {
    pushDoc(d.projectId, 'invoice', (d.kind === 'invoice' ? 'Invoice ' : 'Credit note ') + d.docNo, d.issuedAt)
    pushAudit(d.projectId, d.issuedAt, 'Finance AR', d.kind === 'invoice' ? 'issued' : 'issued-credit', 'ar-document', d.id, d.kind)
  }
  for (const r of receipts) {
    pushAudit(r.projectId, r.receivedAt, 'Finance AR', 'received', 'receipt', r.id, 'Payment received ' + r.receiptNo)
  }
  for (const po of purchaseOrders) {
    pushDoc(po.projectId, 'PO', 'Purchase order ' + po.poNo, po.issuedAt)
    pushAudit(po.projectId, po.issuedAt, 'Procurement', 'issued', 'purchase-order', po.id, po.kind)
  }
  for (const s of subcontracts) {
    const p = projects.find((x) => x.id === s.projectId)!
    pushDoc(s.projectId, 'contract', 'Subcontract award ' + s.code, p.startDate)
    pushAudit(s.projectId, p.startDate, 'Procurement', 'awarded', 'subcontract', s.id, 'Subcontract awarded')
  }
  for (const c of subcontractClaims) {
    const s = subcontracts.find((x) => x.id === c.subcontractId)!
    pushAudit(s.projectId, c.period + '-20', 'QS/Commercial', 'verified', 'subcontract-claim', c.id, c.status)
  }
  for (const r of retentions) {
    pushAudit(r.projectId, projects.find((x) => x.id === r.projectId)!.startDate, 'Finance AR', 'recorded', 'retention', r.id, r.kind + ' ' + r.status)
  }

  // ---- monthly site documents ----
  for (const project of projects) {
    const months = new Set<string>()
    for (const h of claimHeaders) if (h.projectId === project.id) months.add(h.period)
    for (const ym of months) {
      const count = rng.int(1, 2)
      for (let i = 0; i < count; i++) {
        const category = rng.pick(MONTHLY_CATEGORIES)
        pushDoc(project.id, category, category.charAt(0).toUpperCase() + category.slice(1) + ' record ' + ym, ym + '-15', rng.int(1, 3))
      }
    }
    // defects for DLP / final-account-dispute projects
    if (project.status === 'DLP' || project.status === 'Final Account Dispute') {
      const defectCount = rng.int(3, 8)
      for (let i = 0; i < defectCount; i++) {
        pushDoc(project.id, 'defects', 'Defect item ' + (i + 1), project.plannedCompletionDate, rng.int(1, 2))
      }
    }
    // final account documents for closed-out projects
    if (['Completed', 'DLP', 'Final Account Dispute'].includes(project.status)) {
      pushDoc(project.id, 'final-account', 'Final account statement ' + project.code, project.plannedCompletionDate)
      pushAudit(project.id, project.plannedCompletionDate, 'QS/Commercial', 'issued', 'final-account', project.id, 'Final account issued')
    }
  }

  return { documents, auditEvents }
}
