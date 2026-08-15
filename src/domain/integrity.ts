/**
 * TASK-014 — demo data integrity suite (MOCK-DATA-VALIDATION.md).
 *
 * Programmatic integrity checks over the generated baseline:
 * unique ids / foreign keys, adjusted-contract reconciliation,
 * current vs cumulative claim logic, claim/cert/billing chain,
 * positive invoice vs negative credit, allocation limits, cost/POC
 * totals and hero-scenario presence. Deterministic regeneration is
 * covered by the engine tests and re-asserted in the suite tests.
 */

import type { BaselineDataset } from './types'

export interface IntegrityCheck {
  id: string
  label: string
  status: 'ok' | 'fail'
  detail?: string
}

export interface IntegrityReport {
  engineVersion: string
  seedVersion: string
  okCount: number
  failCount: number
  checks: IntegrityCheck[]
}

const round2 = (v: number): number => Math.round(v * 100) / 100 + 0

export function runIntegrityChecks(ds: BaselineDataset): IntegrityReport {
  const checks: IntegrityCheck[] = []
  const ok = (id: string, label: string, pass: boolean, detail?: string) =>
    checks.push({ id, label, status: pass ? 'ok' : 'fail', detail: pass ? undefined : detail })

  // ---- unique ids ----
  const idSets: { label: string; ids: string[] }[] = [
    { label: 'parties', ids: ds.parties.map((x) => x.id) },
    { label: 'projects', ids: ds.projects.map((x) => x.id) },
    { label: 'contracts', ids: ds.contracts.map((x) => x.id) },
    { label: 'work-packages', ids: ds.workPackages.map((x) => x.id) },
    { label: 'commercial-changes', ids: ds.commercialChanges.map((x) => x.id) },
    { label: 'progress-measurements', ids: ds.progressMeasurements.map((x) => x.id) },
    { label: 'claim-headers', ids: ds.claimHeaders.map((x) => x.id) },
    { label: 'claim-lines', ids: ds.claimLines.map((x) => x.id) },
    { label: 'certifications', ids: ds.certifications.map((x) => x.id) },
    { label: 'ar-documents', ids: ds.arDocuments.map((x) => x.id) },
    { label: 'receipts', ids: ds.receipts.map((x) => x.id) },
    { label: 'allocations', ids: ds.allocations.map((x) => x.id) },
    { label: 'purchase-orders', ids: ds.purchaseOrders.map((x) => x.id) },
    { label: 'subcontracts', ids: ds.subcontracts.map((x) => x.id) },
    { label: 'subcontract-claims', ids: ds.subcontractClaims.map((x) => x.id) },
    { label: 'cost-transactions', ids: ds.costTransactions.map((x) => x.id) },
    { label: 'poc-snapshots', ids: ds.pocSnapshots.map((x) => x.id) },
    { label: 'retentions', ids: ds.retentions.map((x) => x.id) },
    { label: 'documents', ids: ds.documents.map((x) => x.id) },
    { label: 'audit-events', ids: ds.auditEvents.map((x) => x.id) },
  ]
  for (const { label, ids } of idSets) {
    ok('unique-' + label, 'Unique ids: ' + label, new Set(ids).size === ids.length)
  }

  // ---- foreign keys ----
  const fk = (id: string, label: string, rows: { ref: string | null }[], refs: Set<string>) => {
    const missing = rows.filter((r) => r.ref !== null && !refs.has(r.ref))
    ok('fk-' + id, 'Foreign keys: ' + label, missing.length === 0, missing.length ? missing.length + ' dangling' : undefined)
  }
  const projectIds = new Set(ds.projects.map((p) => p.id))
  const contractIds = new Set(ds.contracts.map((c) => c.id))
  const partyIds = new Set(ds.parties.map((p) => p.id))
  const headerIds = new Set(ds.claimHeaders.map((h) => h.id))
  const wpIds = new Set(ds.workPackages.map((w) => w.id))
  const certIds = new Set(ds.certifications.map((c) => c.id))
  const arIds = new Set(ds.arDocuments.map((d) => d.id))
  const receiptIds = new Set(ds.receipts.map((r) => r.id))
  const subIds = new Set(ds.subcontracts.map((s) => s.id))

  fk('contracts', 'contract → project', ds.contracts.map((c) => ({ ref: c.projectId })), projectIds)
  fk('work-packages', 'work package → contract', ds.workPackages.map((w) => ({ ref: w.contractId })), contractIds)
  fk('changes', 'change → contract', ds.commercialChanges.map((c) => ({ ref: c.contractId })), contractIds)
  fk('measurements', 'measurement → project', ds.progressMeasurements.map((m) => ({ ref: m.projectId })), projectIds)
  fk('headers', 'claim → project', ds.claimHeaders.map((h) => ({ ref: h.projectId })), projectIds)
  fk('lines-header', 'line → header', ds.claimLines.map((l) => ({ ref: l.headerId })), headerIds)
  fk('lines-wp', 'line → work package', ds.claimLines.map((l) => ({ ref: l.workPackageId })), wpIds)
  fk('certs', 'certification → claim', ds.certifications.map((c) => ({ ref: c.claimId })), headerIds)
  fk('ar-certs', 'AR → certification', ds.arDocuments.map((d) => ({ ref: d.certId })), certIds)
  fk('receipts', 'receipt → AR', ds.receipts.map((r) => ({ ref: r.arDocumentId })), arIds)
  fk('alloc-receipts', 'allocation → receipt', ds.allocations.map((a) => ({ ref: a.receiptId })), receiptIds)
  fk('alloc-ar', 'allocation → AR', ds.allocations.map((a) => ({ ref: a.arDocumentId })), arIds)
  fk('alloc-credit', 'allocation → credit note', ds.allocations.map((a) => ({ ref: a.creditDocumentId })), arIds)
  fk('po-vendors', 'order → vendor', ds.purchaseOrders.map((po) => ({ ref: po.vendorId })), partyIds)
  fk('sub-vendors', 'subcontract → vendor', ds.subcontracts.map((s) => ({ ref: s.vendorId })), partyIds)
  fk('subclaims', 'subcontract claim → subcontract', ds.subcontractClaims.map((c) => ({ ref: c.subcontractId })), subIds)
  fk('costs', 'cost → project', ds.costTransactions.map((t) => ({ ref: t.projectId })), projectIds)
  fk('poc', 'POC → project', ds.pocSnapshots.map((s) => ({ ref: s.projectId })), projectIds)
  fk('retentions', 'retention → project', ds.retentions.map((r) => ({ ref: r.projectId })), projectIds)
  fk('documents', 'document → project', ds.documents.map((d) => ({ ref: d.projectId })), projectIds)
  fk('audit', 'audit → project', ds.auditEvents.map((a) => ({ ref: a.projectId })), projectIds)

  // ---- adjusted-contract reconciliation ----
  let adjustedOk = true
  for (const project of ds.projects) {
    const contract = ds.contracts.find((c) => c.projectId === project.id)
    const changes = ds.commercialChanges.filter((c) => c.projectId === project.id && c.status === 'Approved')
    const adjusted = round2((contract?.originalValue ?? 0) + changes.reduce((a, c) => a + c.signedValue, 0))
    if (contract && adjusted < 0) adjustedOk = false
  }
  ok('adjusted-contract', 'Adjusted contract = original + approved changes', adjustedOk)

  // ---- current vs cumulative claim logic ----
  let claimOk = true
  for (const h of ds.claimHeaders) {
    if (round2(h.currentCumulativeEntitlement - h.previousCertified) !== h.thisClaimExGst) claimOk = false
  }
  ok('current-vs-cumulative', 'This Claim = Cumulative Entitlement − Previous Certified', claimOk)
  let lineOk = true
  for (const l of ds.claimLines) {
    if (round2(l.currentAmount - l.priorAmount) !== l.thisPeriodMovement) lineOk = false
  }
  ok('line-movements', 'Line movement = current − prior amount', lineOk)

  // ---- claim/cert/billing chain ----
  const certsByProject = new Map<string, typeof ds.certifications>()
  for (const c of ds.certifications) {
    const list = certsByProject.get(c.projectId) ?? []
    list.push(c)
    certsByProject.set(c.projectId, list)
  }
  const certById = new Map(ds.certifications.map((c) => [c.id, c]))
  let chainOk = true
  for (const d of ds.arDocuments) {
    const cert = certById.get(d.certId)
    if (!cert) continue
    const certs = certsByProject.get(d.projectId) ?? []
    const idx = certs.findIndex((c) => c.id === cert.id)
    const prev = idx > 0 ? certs[idx - 1].certifiedAmount : 0
    if (round2(cert.certifiedAmount - prev) !== d.amount) chainOk = false
  }
  ok('claim-cert-billing', 'AR amount = certification increment', chainOk)

  // ---- positive invoice vs negative credit ----
  let kindOk = true
  for (const d of ds.arDocuments) {
    if (d.kind === 'invoice' && d.total <= 0) kindOk = false
    if (d.kind === 'credit-note' && d.total >= 0) kindOk = false
  }
  ok('invoice-vs-credit', 'Invoices positive, credit notes negative', kindOk)

  // ---- allocation limits ----
  const allocByReceipt = new Map<string, number>()
  for (const a of ds.allocations) allocByReceipt.set(a.receiptId, (allocByReceipt.get(a.receiptId) ?? 0) + a.amount)
  let allocOk = true
  for (const r of ds.receipts) {
    if (round2(allocByReceipt.get(r.id) ?? 0) !== r.amount) allocOk = false
  }
  ok('allocation-limits', 'Receipt allocations sum exactly to the receipt', allocOk)

  // ---- cost/POC totals ----
  let costOk = true
  for (const t of ds.costTransactions) if (t.amount <= 0) costOk = false
  ok('cost-totals', 'Cost transactions positive', costOk)
  let pocOk = true
  for (const s of ds.pocSnapshots) {
    for (const v of [s.costPocPct, s.physicalPct, s.claimPct, s.certPct, s.collectedPct]) {
      if (v < 0 || v > 120) pocOk = false
    }
    if (s.forecastFinalCost <= 0) pocOk = false
  }
  ok('poc-totals', 'POC percentages within 0–120 and forecast positive', pocOk)

  // ---- hero scenario presence ----
  const tags = new Set<string>()
  for (const p of ds.projects) for (const s of p.scenarios) tags.add(s)
  const heroes = ['healthy', 'vo-heavy', 'cost-overrun', 'negative-claim', 'certification-gap', 'retention-heavy', 'late-ar', 'subcon-overclaim', 'physical-material-with-do', 'progress-work-no-do', 'on-hold', 'final-account-dispute']
  const missing = heroes.filter((h) => !tags.has(h))
  ok('hero-scenarios', 'All twelve hero scenarios present', missing.length === 0, missing.length ? 'missing: ' + missing.join(',') : undefined)

  // ---- retention consistency ----
  const retByProject = new Map<string, number>()
  for (const h of ds.claimHeaders) retByProject.set(h.projectId, (retByProject.get(h.projectId) ?? 0) + h.retentionAmount)
  let retOk = true
  for (const r of ds.retentions) {
    if (r.kind === 'receivable' && round2(retByProject.get(r.projectId) ?? 0) !== r.amount) retOk = false
    if (r.releasedAmount > r.amount + 0.011) retOk = false
  }
  ok('retention-consistency', 'Receivable retention = accumulated claim retention', retOk)

  const okCount = checks.filter((c) => c.status === 'ok').length
  const failCount = checks.length - okCount
  return { engineVersion: ds.meta.engineVersion, seedVersion: ds.meta.seedVersion, okCount, failCount, checks }
}
