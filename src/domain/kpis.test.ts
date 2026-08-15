import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../data/loadCatalogs'
import { generateBaseline } from './seed/engine'
import { computeProjectKpis, formatSgd } from './kpis'
import type { BaselineDataset } from './types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

const ds = build()

describe('computeProjectKpis', () => {
  it('adjusted contract equals original plus approved changes', () => {
    for (const p of ds.projects) {
      const k = computeProjectKpis(ds, p)
      const expected = Math.round((k.originalContract + k.approvedChanges) * 100) / 100
      expect(k.adjustedContract).toBe(expected)
    }
  })

  it('work done equals the latest cumulative entitlement', () => {
    for (const p of ds.projects) {
      const headers = ds.claimHeaders.filter((h) => h.projectId === p.id)
      if (headers.length === 0) continue
      const latest = headers.reduce((a, b) => (a.period > b.period ? a : b))
      expect(computeProjectKpis(ds, p).workDone).toBe(latest.currentCumulativeEntitlement)
    }
  })

  it('certified never exceeds work done on non-negative projects', () => {
    const negativeIds = new Set(ds.projects.filter((p) => p.scenarios.includes('negative-claim')).map((p) => p.id))
    for (const p of ds.projects) {
      if (negativeIds.has(p.id)) continue
      const k = computeProjectKpis(ds, p)
      expect(k.certified).toBeLessThanOrEqual(k.workDone + 0.011)
    }
  })

  it('AR exposure = billed + credits - collected', () => {
    for (const p of ds.projects) {
      const k = computeProjectKpis(ds, p)
      expect(k.ar).toBe(Math.round((k.billed + k.credits - k.collected) * 100) / 100)
    }
  })

  it('credits are negative and reduce AR', () => {
    for (const p of ds.projects) {
      const k = computeProjectKpis(ds, p)
      expect(k.credits).toBeLessThanOrEqual(0)
    }
  })

  it('forecast and POC come from the latest actual snapshot', () => {
    for (const p of ds.projects) {
      const snaps = ds.pocSnapshots.filter((s) => s.projectId === p.id && s.kind === 'actual')
      if (snaps.length === 0) continue
      const latest = snaps.reduce((a, b) => (a.period > b.period ? a : b))
      const k = computeProjectKpis(ds, p)
      expect(k.forecast).toBe(latest.forecastFinalCost)
      expect(k.poc).toBe(latest.costPocPct)
    }
  })

  it('cost-overrun projects show negative forecast margin', () => {
    const ids = new Set(ds.projects.filter((p) => p.scenarios.includes('cost-overrun')).map((p) => p.id))
    let found = false
    for (const p of ds.projects) {
      if (!ids.has(p.id)) continue
      if (computeProjectKpis(ds, p).marginPct < 0) found = true
    }
    expect(found).toBe(true)
  })

  it('formatSgd renders SGD currency', () => {
    expect(formatSgd(1234567)).toContain('1,234,567')
  })
})
