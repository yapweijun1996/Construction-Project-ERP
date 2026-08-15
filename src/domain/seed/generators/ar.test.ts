import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../../../data/loadCatalogs'
import { generateBaseline } from '../engine'
import type { BaselineDataset } from '../../types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

const ds = build()
const negativeProjectIds = new Set(ds.projects.filter((p) => p.scenarios.includes('negative-claim')).map((p) => p.id))
const lateArIds = new Set(ds.projects.filter((p) => p.scenarios.includes('late-ar')).map((p) => p.id))

describe('generateAr — SPEC-001 targets', () => {
  it('AR documents fall within 400–600', () => {
    expect(ds.arDocuments.length).toBeGreaterThanOrEqual(400)
    expect(ds.arDocuments.length).toBeLessThanOrEqual(600)
  })

  it('receipts + allocations fall within 500–800', () => {
    const total = ds.receipts.length + ds.allocations.length
    expect(total).toBeGreaterThanOrEqual(500)
    expect(total).toBeLessThanOrEqual(800)
  })
})

describe('generateAr — invoice vs credit semantics', () => {
  it('produces both invoices and credit notes', () => {
    expect(ds.arDocuments.some((d) => d.kind === 'invoice')).toBe(true)
    expect(ds.arDocuments.some((d) => d.kind === 'credit-note')).toBe(true)
  })

  it('credit notes carry negative amounts (BR-AR-002)', () => {
    for (const d of ds.arDocuments) {
      if (d.kind === 'credit-note') expect(d.total).toBeLessThan(0)
      else expect(d.total).toBeGreaterThan(0)
    }
  })

  it('negative-certification projects receive AR credit notes (ADR-008)', () => {
    const credits = ds.arDocuments.filter((d) => negativeProjectIds.has(d.projectId) && d.kind === 'credit-note')
    expect(credits.length).toBeGreaterThan(0)
  })

  it('AR amount equals its CCAR certification increment', () => {
    const certsByProject = new Map<string, typeof ds.certifications>()
    for (const c of ds.certifications) {
      const list = certsByProject.get(c.projectId) ?? []
      list.push(c)
      certsByProject.set(c.projectId, list)
    }
    const certById = new Map(ds.certifications.map((c) => [c.id, c]))
    for (const d of ds.arDocuments) {
      const cert = certById.get(d.certId)!
      const certs = certsByProject.get(d.projectId)!
      const idx = certs.findIndex((c) => c.id === cert.id)
      const prev = idx > 0 ? certs[idx - 1].certifiedAmount : 0
      const increment = Math.round((cert.certifiedAmount - prev) * 100) / 100
      expect(d.amount).toBe(increment)
    }
  })
})

describe('generateAr — collection and allocation', () => {
  it('allocations against a receipt sum exactly to the receipt amount', () => {
    const byReceipt = new Map<string, typeof ds.allocations>()
    for (const a of ds.allocations) {
      const list = byReceipt.get(a.receiptId) ?? []
      list.push(a)
      byReceipt.set(a.receiptId, list)
    }
    for (const r of ds.receipts) {
      const allocs = byReceipt.get(r.id) ?? []
      const sum = Math.round(allocs.reduce((s, a) => s + a.amount, 0) * 100) / 100
      expect(sum).toBe(r.amount)
    }
  })

  it('never over-collects an AR document', () => {
    const collected = new Map<string, number>()
    for (const r of ds.receipts) {
      collected.set(r.arDocumentId, (collected.get(r.arDocumentId) ?? 0) + r.amount)
    }
    for (const d of ds.arDocuments) {
      if (d.kind !== 'invoice') continue // credit notes are applied, not collected
      const got = Math.round((collected.get(d.id) ?? 0) * 100) / 100
      expect(got).toBeLessThanOrEqual(d.total + 0.011)
    }
  })

  it('existing AR credit is applied via allocations (BR-AR-003)', () => {
    const creditAllocs = ds.allocations.filter((a) => a.creditDocumentId !== null)
    expect(creditAllocs.length).toBeGreaterThan(0)
    const creditIds = new Set(ds.arDocuments.filter((d) => d.kind === 'credit-note').map((d) => d.id))
    for (const a of creditAllocs) {
      expect(creditIds.has(a.creditDocumentId!)).toBe(true)
    }
  })

  it('collection statuses distinguish invoiced/collected (BR-AR-001)', () => {
    const statuses = new Set(ds.arDocuments.map((d) => d.status))
    expect(statuses.size).toBeGreaterThanOrEqual(2)
  })

  it('late-ar projects keep some invoices unpaid', () => {
    const unpaid = ds.arDocuments.filter((d) => lateArIds.has(d.projectId) && d.status === 'Issued')
    expect(unpaid.length).toBeGreaterThan(0)
  })
})

describe('generateAr — keys', () => {
  it('AR certId resolves to a certification of the same project', () => {
    const certById = new Map(ds.certifications.map((c) => [c.id, c]))
    for (const d of ds.arDocuments) {
      const c = certById.get(d.certId)
      expect(c).toBeDefined()
      expect(c!.projectId).toBe(d.projectId)
    }
  })

  it('receipt and allocation foreign keys resolve', () => {
    const arIds = new Set(ds.arDocuments.map((d) => d.id))
    const receiptIds = new Set(ds.receipts.map((r) => r.id))
    for (const r of ds.receipts) expect(arIds.has(r.arDocumentId)).toBe(true)
    for (const a of ds.allocations) {
      expect(receiptIds.has(a.receiptId)).toBe(true)
      expect(arIds.has(a.arDocumentId)).toBe(true)
    }
  })
})
