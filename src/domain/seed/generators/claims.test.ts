import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../../../data/loadCatalogs'
import { generateBaseline, ENGINE_VERSION } from '../engine'
import type { BaselineDataset } from '../../types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

const ds = build()
const negativeProjectIds = new Set(ds.projects.filter((p) => p.scenarios.includes('negative-claim')).map((p) => p.id))
const gapProjectIds = new Set(ds.projects.filter((p) => p.scenarios.includes('certification-gap')).map((p) => p.id))

describe('generateClaims — SPEC-001 targets', () => {
  it('progress measurements fall within 500–800', () => {
    expect(ds.progressMeasurements.length).toBeGreaterThanOrEqual(500)
    expect(ds.progressMeasurements.length).toBeLessThanOrEqual(800)
  })

  it('PCAR headers fall within 350–500', () => {
    expect(ds.claimHeaders.length).toBeGreaterThanOrEqual(350)
    expect(ds.claimHeaders.length).toBeLessThanOrEqual(500)
  })

  it('CCAR certifications fall within 300–450', () => {
    expect(ds.certifications.length).toBeGreaterThanOrEqual(300)
    expect(ds.certifications.length).toBeLessThanOrEqual(450)
  })
})

describe('generateClaims — PCAR arithmetic (ADR-004)', () => {
  it('thisClaimExGst equals cumulative entitlement minus previous certified', () => {
    for (const h of ds.claimHeaders) {
      const diff = Math.round((h.currentCumulativeEntitlement - h.previousCertified) * 100) / 100
      expect(h.thisClaimExGst).toBe(diff)
    }
  })

  it('GST and total are consistent per header', () => {
    for (const h of ds.claimHeaders) {
      expect(h.gst).toBe(Math.round((h.thisClaimExGst * h.gstRatePct) / 100 * 100) / 100)
      expect(h.total).toBe(Math.round((h.thisClaimExGst + h.gst) * 100) / 100)
    }
  })

  it('header cumulative entitlement equals the sum of its line current amounts', () => {
    for (const h of ds.claimHeaders) {
      const lines = ds.claimLines.filter((l) => l.headerId === h.id)
      const sum = Math.round(lines.reduce((a, l) => a + l.currentAmount, 0) * 100) / 100
      expect(h.currentCumulativeEntitlement).toBe(sum)
    }
  })

  it('line movement equals current minus prior', () => {
    for (const l of ds.claimLines) {
      expect(l.thisPeriodMovement).toBe(Math.round((l.currentAmount - l.priorAmount) * 100) / 100)
    }
  })

  it('retention fields are explicit and arithmetic-consistent (BR-CLAIM-005)', () => {
    for (const h of ds.claimHeaders) {
      if (h.thisClaimExGst > 0) {
        expect(h.retentionPct).toBeGreaterThan(0)
        expect(h.retentionAmount).toBe(Math.round((h.thisClaimExGst * h.retentionPct) / 100 * 100) / 100)
      } else {
        expect(h.retentionAmount).toBe(0)
      }
    }
  })
})

describe('generateClaims — GST by year (Singapore history)', () => {
  it('applies 7% in 2022, 8% in 2023, 9% from 2024', () => {
    for (const h of ds.claimHeaders) {
      const year = parseInt(h.period.slice(0, 4), 10)
      const expected = year <= 2022 ? 7 : year === 2023 ? 8 : 9
      expect(h.gstRatePct).toBe(expected)
    }
  })
})

describe('generateClaims — hero scenarios', () => {
  it('negative-claim projects contain a negative current claim', () => {
    const neg = ds.claimHeaders.filter((h) => negativeProjectIds.has(h.projectId) && h.thisClaimExGst < 0)
    expect(neg.length).toBeGreaterThan(0)
  })

  it('negative certification follows the negative claim (ADR-008)', () => {
    const byProject = new Map<string, typeof ds.certifications>()
    for (const c of ds.certifications) {
      const list = byProject.get(c.projectId) ?? []
      list.push(c)
      byProject.set(c.projectId, list)
    }
    let negativeIncrement = false
    let negativeRemark = false
    for (const pid of negativeProjectIds) {
      const certs = byProject.get(pid) ?? []
      for (let i = 1; i < certs.length; i++) {
        if (certs[i].certifiedAmount < certs[i - 1].certifiedAmount) negativeIncrement = true
      }
      if (certs.some((c) => c.remarks.includes('Negative certification'))) negativeRemark = true
    }
    expect(negativeIncrement || negativeRemark).toBe(true)
  })

  it('certification-gap projects have fewer CCARs than PCARs', () => {
    for (const pid of gapProjectIds) {
      const pcars = ds.claimHeaders.filter((h) => h.projectId === pid).length
      const ccars = ds.certifications.filter((c) => c.projectId === pid).length
      expect(ccars).toBeLessThan(pcars)
    }
  })
})

describe('generateClaims — certification semantics (BR-CERT-001)', () => {
  it('certified may differ from claimed: partial and on-hold statuses exist', () => {
    const statuses = new Set(ds.certifications.map((c) => c.status))
    expect(statuses.has('Certified')).toBe(true)
    expect(statuses.has('Partially Certified') || statuses.has('On Hold')).toBe(true)
  })

  it('cumulative certified never exceeds cumulative entitlement on non-negative projects', () => {
    const headerById = new Map(ds.claimHeaders.map((h) => [h.id, h]))
    for (const c of ds.certifications) {
      if (negativeProjectIds.has(c.projectId)) continue
      const header = headerById.get(c.claimId)!
      expect(c.certifiedAmount).toBeLessThanOrEqual(header.currentCumulativeEntitlement + 0.011)
    }
  })

  it('certifiedAmount advances monotonically on non-negative projects', () => {
    const byProject = new Map<string, typeof ds.certifications>()
    for (const c of ds.certifications) {
      const list = byProject.get(c.projectId) ?? []
      list.push(c)
      byProject.set(c.projectId, list)
    }
    for (const [pid, certs] of byProject) {
      if (negativeProjectIds.has(pid)) continue
      for (let i = 1; i < certs.length; i++) {
        expect(certs[i].certifiedAmount).toBeGreaterThanOrEqual(certs[i - 1].certifiedAmount)
      }
    }
  })
})

describe('generateClaims — structure and keys', () => {
  it('CCAR claimId resolves to a PCAR of the same project', () => {
    const headerById = new Map(ds.claimHeaders.map((h) => [h.id, h]))
    for (const c of ds.certifications) {
      const h = headerById.get(c.claimId)
      expect(h).toBeDefined()
      expect(h!.projectId).toBe(c.projectId)
    }
  })

  it('claim lines resolve to work packages', () => {
    const wpIds = new Set(ds.workPackages.map((w) => w.id))
    for (const l of ds.claimLines) {
      expect(wpIds.has(l.workPackageId)).toBe(true)
    }
  })

  it('periods are ordered and unique per project', () => {
    const seen = new Map<string, string>()
    for (const h of ds.claimHeaders) {
      const prev = seen.get(h.projectId)
      if (prev !== undefined) expect(h.period > prev).toBe(true)
      seen.set(h.projectId, h.period)
    }
  })

  it('measurements carry plan and actual kinds', () => {
    expect(ds.progressMeasurements.some((m) => m.kind === 'plan')).toBe(true)
    expect(ds.progressMeasurements.some((m) => m.kind === 'actual')).toBe(true)
    for (const m of ds.progressMeasurements) {
      expect(m.cumulativePct).toBeGreaterThanOrEqual(0)
      expect(m.cumulativePct).toBeLessThanOrEqual(100)
    }
  })
})

describe('engine meta', () => {
  it('ENGINE_VERSION reflects the full baseline generation', () => {
    expect(ENGINE_VERSION).toBe('0.5.0')
  })
})
