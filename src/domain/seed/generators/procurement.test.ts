import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../../../data/loadCatalogs'
import { generateBaseline } from '../engine'
import type { BaselineDataset } from '../../types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

const ds = build()
const overclaimIds = new Set(ds.projects.filter((p) => p.scenarios.includes('subcon-overclaim')).map((p) => p.id))
const subcontractorIds = new Set(ds.parties.filter((p) => p.type === 'subcontractor').map((p) => p.id))
const vendorIds = new Set(ds.parties.filter((p) => p.type === 'supplier' || p.type === 'subcontractor').map((p) => p.id))

describe('generateProcurement — SPEC-001 targets', () => {
  it('purchase/subcontract orders fall within 700–1200', () => {
    expect(ds.purchaseOrders.length).toBeGreaterThanOrEqual(700)
    expect(ds.purchaseOrders.length).toBeLessThanOrEqual(1200)
  })

  it('subcontract claims fall within 400–700', () => {
    expect(ds.subcontractClaims.length).toBeGreaterThanOrEqual(400)
    expect(ds.subcontractClaims.length).toBeLessThanOrEqual(700)
  })
})

describe('generateProcurement — subcontract verification (SPEC-007)', () => {
  it('certified never exceeds claimed', () => {
    for (const c of ds.subcontractClaims) {
      expect(c.certified).toBeLessThanOrEqual(c.claimed)
    }
  })

  it('subcon-overclaim projects contain claims verified down', () => {
    const down = ds.subcontractClaims.filter((c) => {
      const sub = ds.subcontracts.find((s) => s.id === c.subcontractId)!
      return overclaimIds.has(sub.projectId) && c.certified < c.claimed
    })
    expect(down.length).toBeGreaterThan(0)
  })

  it('backcharge contras produce negative certifications', () => {
    expect(ds.subcontractClaims.some((c) => c.certified < 0)).toBe(true)
  })
})

describe('generateProcurement — keys and parties', () => {
  it('PO vendors are suppliers or subcontractors', () => {
    for (const po of ds.purchaseOrders) {
      expect(vendorIds.has(po.vendorId)).toBe(true)
    }
  })

  it('both PO kinds exist', () => {
    expect(ds.purchaseOrders.some((p) => p.kind === 'po')).toBe(true)
    expect(ds.purchaseOrders.some((p) => p.kind === 'subcontract-award')).toBe(true)
  })

  it('subcontract vendors are subcontractors', () => {
    for (const s of ds.subcontracts) {
      expect(subcontractorIds.has(s.vendorId)).toBe(true)
    }
  })

  it('subcontract claims resolve to subcontracts', () => {
    const subIds = new Set(ds.subcontracts.map((s) => s.id))
    for (const c of ds.subcontractClaims) {
      expect(subIds.has(c.subcontractId)).toBe(true)
    }
  })
})
