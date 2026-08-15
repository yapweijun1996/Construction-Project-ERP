import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../../data/loadCatalogs'
import { generateBaseline } from './engine'
import type { BaselineDataset } from '../types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

const ds = build()

describe('SPEC-001 full target reconciliation', () => {
  it('meets every SPEC-001 transaction target band', () => {
    expect(ds.projects.length).toBe(30)
    expect(ds.parties.filter((p) => p.type === 'client').length).toBeGreaterThanOrEqual(15)
    expect(ds.parties.filter((p) => p.type !== 'client').length).toBeGreaterThanOrEqual(80)
    expect(ds.workPackages.length).toBeGreaterThanOrEqual(800)
    expect(ds.workPackages.length).toBeLessThanOrEqual(1500)
    expect(ds.commercialChanges.length).toBeGreaterThanOrEqual(300)
    expect(ds.commercialChanges.length).toBeLessThanOrEqual(500)
    expect(ds.progressMeasurements.length).toBeGreaterThanOrEqual(500)
    expect(ds.progressMeasurements.length).toBeLessThanOrEqual(800)
    expect(ds.claimHeaders.length).toBeGreaterThanOrEqual(350)
    expect(ds.claimHeaders.length).toBeLessThanOrEqual(500)
    expect(ds.certifications.length).toBeGreaterThanOrEqual(300)
    expect(ds.certifications.length).toBeLessThanOrEqual(450)
    expect(ds.arDocuments.length).toBeGreaterThanOrEqual(400)
    expect(ds.arDocuments.length).toBeLessThanOrEqual(600)
    expect(ds.receipts.length + ds.allocations.length).toBeGreaterThanOrEqual(500)
    expect(ds.receipts.length + ds.allocations.length).toBeLessThanOrEqual(800)
    expect(ds.purchaseOrders.length).toBeGreaterThanOrEqual(700)
    expect(ds.purchaseOrders.length).toBeLessThanOrEqual(1200)
    expect(ds.subcontractClaims.length).toBeGreaterThanOrEqual(400)
    expect(ds.subcontractClaims.length).toBeLessThanOrEqual(700)
    expect(ds.costTransactions.length).toBeGreaterThanOrEqual(10000)
    expect(ds.pocSnapshots.length).toBeGreaterThanOrEqual(500)
    expect(ds.auditEvents.length).toBeGreaterThanOrEqual(3000)
  })
})

describe('hero scenarios — data-level presence', () => {
  it('healthy / vo-heavy / retention-heavy / late-ar / certification-gap exist in tags', () => {
    const tags = new Set<string>()
    for (const p of ds.projects) for (const s of p.scenarios) tags.add(s)
    for (const t of ['healthy', 'vo-heavy', 'retention-heavy', 'late-ar', 'certification-gap', 'cost-overrun', 'negative-claim', 'subcon-overclaim', 'physical-material-with-do', 'progress-work-no-do', 'on-hold', 'final-account-dispute']) {
      expect(tags.has(t)).toBe(true)
    }
  })

  it('cost-overrun projects carry an inflated forecast final cost', () => {
    const ids = new Set(ds.projects.filter((p) => p.scenarios.includes('cost-overrun')).map((p) => p.id))
    const snaps = ds.pocSnapshots.filter((s) => ids.has(s.projectId))
    expect(snaps.length).toBeGreaterThan(0)
    const projectValue = (pid: string) => ds.projects.find((p) => p.id === pid)!.originalContractValue
    expect(snaps.some((s) => s.forecastFinalCost > projectValue(s.projectId) * 1.05)).toBe(true)
  })

  it('BR-COST-001: claim progress and accounting POC are distinct measures', () => {
    const divergent = ds.pocSnapshots.filter((s) => Math.abs(s.claimPct - s.costPocPct) > 0.5)
    expect(divergent.length).toBeGreaterThan(0)
    const physicalDivergent = ds.pocSnapshots.filter((s) => Math.abs(s.physicalPct - s.costPocPct) > 0.5)
    expect(physicalDivergent.length).toBeGreaterThan(0)
  })
})
