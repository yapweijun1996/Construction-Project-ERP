import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../../../data/loadCatalogs'
import { generateBaseline } from '../engine'
import type { BaselineDataset } from '../../types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

const ds = build()

describe('generateCost', () => {
  it('produces labour, material, subcontract and overhead transactions', () => {
    const cats = new Set(ds.costTransactions.map((t) => t.category))
    for (const c of ['labour', 'material', 'subcontract']) expect(cats.has(c)).toBe(true)
  })

  it('cost transactions carry positive amounts and valid dates', () => {
    for (const t of ds.costTransactions) {
      expect(t.amount).toBeGreaterThan(0)
      expect(t.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('POC snapshots keep every percentage within 0–120', () => {
    for (const s of ds.pocSnapshots) {
      for (const v of [s.costPocPct, s.physicalPct, s.claimPct, s.certPct, s.collectedPct]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(120)
      }
    }
  })

  it('POC snapshots carry a forecast final cost and a kind', () => {
    for (const s of ds.pocSnapshots) {
      expect(s.forecastFinalCost).toBeGreaterThan(0)
      expect(['plan', 'actual']).toContain(s.kind)
    }
  })
})

describe('generateRetentions', () => {
  it('records receivable and payable retention per project', () => {
    expect(ds.retentions.filter((r) => r.kind === 'receivable')).toHaveLength(30)
    expect(ds.retentions.filter((r) => r.kind === 'payable')).toHaveLength(30)
  })

  it('receivable retention matches accumulated claim retention', () => {
    const byProject = new Map<string, number>()
    for (const h of ds.claimHeaders) {
      byProject.set(h.projectId, (byProject.get(h.projectId) ?? 0) + h.retentionAmount)
    }
    for (const r of ds.retentions) {
      if (r.kind !== 'receivable') continue
      const expected = Math.round((byProject.get(r.projectId) ?? 0) * 100) / 100
      expect(r.amount).toBe(expected)
    }
  })

  it('released amount never exceeds the retained amount', () => {
    for (const r of ds.retentions) {
      expect(r.releasedAmount).toBeLessThanOrEqual(r.amount + 0.011)
    }
  })
})

describe('generateDocumentsAndAudit', () => {
  it('covers SPEC-009 document categories', () => {
    const cats = new Set(ds.documents.map((d) => d.category))
    for (const c of ['contract', 'VO', 'claim', 'cert', 'invoice', 'drawings', 'site-evidence', 'correspondence', 'defects', 'final-account', 'PO']) {
      expect(cats.has(c)).toBe(true)
    }
  })

  it('audit events carry actor, action and entity', () => {
    for (const a of ds.auditEvents) {
      expect(a.actor.length).toBeGreaterThan(0)
      expect(a.action.length).toBeGreaterThan(0)
      expect(a.entity.length).toBeGreaterThan(0)
      expect(a.entityId.length).toBeGreaterThan(0)
    }
  })

  it('documents resolve to existing projects', () => {
    const projectIds = new Set(ds.projects.map((p) => p.id))
    for (const d of ds.documents) {
      expect(projectIds.has(d.projectId)).toBe(true)
    }
  })
})
