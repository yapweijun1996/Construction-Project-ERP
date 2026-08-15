import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../data/loadCatalogs'
import { generateBaseline } from './seed/engine'
import { runIntegrityChecks } from './integrity'
import type { BaselineDataset } from './types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

describe('runIntegrityChecks — generated baseline', () => {
  it('passes every check with zero failures', () => {
    const report = runIntegrityChecks(build())
    expect(report.failCount).toBe(0)
    expect(report.okCount).toBe(report.checks.length)
    expect(report.checks.length).toBeGreaterThanOrEqual(40)
    expect(report.seedVersion).toBe('SG-DEMO-2026.1')
  })

  it('is deterministic across regeneration', () => {
    const a = runIntegrityChecks(build())
    const b = runIntegrityChecks(build())
    expect(a).toEqual(b)
  })
})

describe('runIntegrityChecks — breakage injection', () => {
  const checkStatus = (ds: BaselineDataset, id: string): string => {
    const report = runIntegrityChecks(ds)
    return report.checks.find((c) => c.id === id)?.status ?? 'missing'
  }

  it('flags duplicate ids', () => {
    const ds = build()
    ds.parties = [...ds.parties, { ...ds.parties[0] }]
    expect(checkStatus(ds, 'unique-parties')).toBe('fail')
  })

  it('flags dangling foreign keys', () => {
    const ds = build()
    ds.workPackages[0] = { ...ds.workPackages[0], contractId: 'ct-missing' }
    expect(checkStatus(ds, 'fk-work-packages')).toBe('fail')
  })

  it('flags broken current-vs-cumulative arithmetic', () => {
    const ds = build()
    ds.claimHeaders[0] = { ...ds.claimHeaders[0], thisClaimExGst: ds.claimHeaders[0].thisClaimExGst + 1 }
    expect(checkStatus(ds, 'current-vs-cumulative')).toBe('fail')
  })

  it('flags a positive credit note', () => {
    const ds = build()
    const idx = ds.arDocuments.findIndex((d) => d.kind === 'credit-note')
    ds.arDocuments[idx] = { ...ds.arDocuments[idx], total: Math.abs(ds.arDocuments[idx].total) }
    expect(checkStatus(ds, 'invoice-vs-credit')).toBe('fail')
  })

  it('flags an over-collected invoice', () => {
    const ds = build()
    const invoice = ds.arDocuments.find((d) => d.kind === 'invoice')!
    ds.receipts = [
      ...ds.receipts,
      { id: 'rcp-bogus', projectId: invoice.projectId, arDocumentId: invoice.id, receiptNo: 'RCP-BOGUS', receivedAt: invoice.issuedAt, amount: invoice.total + 1 },
    ]
    expect(checkStatus(ds, 'allocation-limits')).toBe('fail')
  })

  it('flags a missing hero scenario', () => {
    const ds = build()
    ds.projects = ds.projects.map((p) => ({ ...p, scenarios: p.scenarios.filter((s) => s !== 'negative-claim') }))
    expect(checkStatus(ds, 'hero-scenarios')).toBe('fail')
  })

  it('flags broken retention reconciliation', () => {
    const ds = build()
    const idx = ds.retentions.findIndex((r) => r.kind === 'receivable')
    ds.retentions[idx] = { ...ds.retentions[idx], amount: 0 }
    expect(checkStatus(ds, 'retention-consistency')).toBe('fail')
  })
})
