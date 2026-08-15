/**
 * TASK-003 Part 3a — AR documents, receipts and allocations.
 *
 * Flow per SPEC-006: CCAR -> AR Document -> Receipt/Credit Allocation -> Settlement.
 * - BR-AR-001: certified != invoiced != collected are distinct stages.
 * - BR-AR-002 / ADR-008: negative certification produces an explicit
 *   credit-note AR document.
 * - BR-AR-003: existing AR credit is applied during allocation — it is never
 *   deducted again inside the next PCAR.
 */

import type { Allocation, ArDocument, Certification, ClaimHeader, Project, Receipt } from '../../types'
import type { SeedConfig } from '../config'
import { Random } from '../prng'

export interface ArOutput {
  arDocuments: ArDocument[]
  receipts: Receipt[]
  allocations: Allocation[]
}

const round2 = (v: number): number => Math.round(v * 100) / 100 + 0

export function generateAr(
  config: SeedConfig,
  projects: Project[],
  claimHeaders: ClaimHeader[],
  certifications: Certification[],
  rng: Random,
): ArOutput {
  void config
  const arDocuments: ArDocument[] = []
  const receipts: Receipt[] = []
  const allocations: Allocation[] = []

  const headerById = new Map(claimHeaders.map((h) => [h.id, h]))
  const certsByProject = new Map<string, Certification[]>()
  for (const c of certifications) {
    const list = certsByProject.get(c.projectId) ?? []
    list.push(c)
    certsByProject.set(c.projectId, list)
  }

  let arSeq = 0
  let receiptSeq = 0
  let allocSeq = 0

  for (const project of projects) {
    const certs = certsByProject.get(project.id) ?? []
    let prevCertified = 0
    const creditPool: ArDocument[] = []
    const projectInvoices: { doc: ArDocument; receiptIds: string[] }[] = []

    for (const cert of certs) {
      const header = headerById.get(cert.claimId)
      if (!header) continue
      const increment = round2(cert.certifiedAmount - prevCertified)
      prevCertified = cert.certifiedAmount
      if (increment === 0) continue // zero/held certification bills nothing

      arSeq += 1
      const kind = increment > 0 ? 'invoice' : 'credit-note'
      const gst = round2((increment * header.gstRatePct) / 100)
      const doc: ArDocument = {
        id: 'ar-' + String(arSeq).padStart(4, '0'),
        projectId: project.id,
        certId: cert.id,
        docNo: project.code + (kind === 'invoice' ? '-INV-' : '-CN-') + String(arSeq).padStart(3, '0'),
        kind,
        amount: increment,
        gst,
        total: round2(increment + gst),
        issuedAt: header.period + '-28',
        status: 'Issued',
      }
      arDocuments.push(doc)
      if (kind === 'credit-note') {
        creditPool.push(doc)
        continue
      }
      projectInvoices.push({ doc, receiptIds: [] })
    }

    // ---- receipts against invoices (collected != invoiced) ----
    const lateAr = project.scenarios.includes('late-ar')
    for (const entry of projectInvoices) {
      if (rng.next() > (lateAr ? 0.55 : 0.8)) continue // some invoices stay unpaid

      const retainPct = project.retentionPct
      const gross = entry.doc.total
      const retention = round2((gross * retainPct) / 100)
      const payable = round2(Math.max(0, gross - retention))

      const splits = rng.bool(0.12) ? [0.7, 0.3] : [1]
      let issuedMonth = parseInt(entry.doc.issuedAt.slice(0, 4), 10) * 12 + parseInt(entry.doc.issuedAt.slice(5, 7), 10)
      issuedMonth += lateAr ? rng.int(2, 5) : rng.int(0, 2)
      const y = Math.floor((issuedMonth - 1) / 12)
      const m = ((issuedMonth - 1) % 12) + 1
      const receivedAt = y + '-' + String(m).padStart(2, '0') + '-28'

      let remaining = payable
      for (const share of splits) {
        const amount = round2(Math.min(remaining, round2(payable * share)))
        if (amount <= 0) continue
        remaining = round2(remaining - amount)
        receiptSeq += 1
        const receipt: Receipt = {
          id: 'rcp-' + String(receiptSeq).padStart(4, '0'),
          projectId: project.id,
          arDocumentId: entry.doc.id,
          receiptNo: 'RCP-' + String(receiptSeq).padStart(4, '0'),
          receivedAt,
          amount,
        }
        receipts.push(receipt)
        entry.receiptIds.push(receipt.id)
      }
    }

    // ---- allocations: one per receipt, credit applied during allocation ----
    for (const entry of projectInvoices) {
      for (const receiptId of entry.receiptIds) {
        const receipt = receipts.find((r) => r.id === receiptId)!
        let allocatedToInvoice = receipt.amount

        // Apply available AR credit first (BR-AR-003).
        for (const credit of creditPool) {
          if (credit.status === 'Settled') continue
          if (allocatedToInvoice <= 0.01) break
          const creditAmount = Math.min(Math.abs(credit.total), allocatedToInvoice)
          allocatedToInvoice = round2(allocatedToInvoice - creditAmount)
          allocSeq += 1
          allocations.push({
            id: 'alc-' + String(allocSeq).padStart(5, '0'),
            projectId: project.id,
            receiptId,
            arDocumentId: entry.doc.id,
            creditDocumentId: credit.id,
            amount: creditAmount,
            allocatedAt: receipt.receivedAt,
          })
          credit.status = 'Settled'
        }

        allocSeq += 1
        allocations.push({
          id: 'alc-' + String(allocSeq).padStart(5, '0'),
          projectId: project.id,
          receiptId,
          arDocumentId: entry.doc.id,
          creditDocumentId: null,
          amount: allocatedToInvoice,
          allocatedAt: receipt.receivedAt,
        })
      }

      // reflect collection status on the AR document
      const collected = round2(entry.receiptIds.reduce((a, id) => a + receipts.find((r) => r.id === id)!.amount, 0))
      entry.doc.status = collected >= entry.doc.total - 0.005 ? 'Settled' : collected > 0 ? 'Partially Paid' : 'Issued'
    }
  }

  return { arDocuments, receipts, allocations }
}
