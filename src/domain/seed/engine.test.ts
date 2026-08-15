import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../../data/loadCatalogs'
import { ENGINE_VERSION, generateBaseline, serializeBaseline, stableStringify, validateCatalogs, SeedEngineError } from './engine'
import { parseSeedConfig } from './config'
import type { BaselineDataset } from '../types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

describe('generateBaseline', () => {
  it('is byte-for-byte reproducible across runs', () => {
    const a = serializeBaseline(build())
    const b = serializeBaseline(build())
    expect(a).toBe(b)
  })

  it('changes output when the seed changes', () => {
    const config = parseSeedConfig(loadSeedConfig())
    const altered = { ...config, seed: config.seed + 1 }
    const a = serializeBaseline(build())
    const b = serializeBaseline(generateBaseline(altered, loadCatalogs()))
    expect(a).not.toBe(b)
  })

  it('records engine/seed metadata', () => {
    const ds = build()
    expect(ds.meta).toEqual({
      engineVersion: ENGINE_VERSION,
      seedVersion: 'SG-DEMO-2026.1',
      seed: 20260815,
    })
  })

  it('materialises 102 parties (18 clients + 84 vendors/subcontractors)', () => {
    const ds = build()
    expect(ds.parties).toHaveLength(102)
    expect(ds.parties.filter((p) => p.type === 'client')).toHaveLength(18)
    expect(ds.parties.filter((p) => p.type === 'supplier')).toHaveLength(50)
    expect(ds.parties.filter((p) => p.type === 'subcontractor')).toHaveLength(34)
  })

  it('materialises 30 projects with resolvable clientId foreign keys', () => {
    const ds = build()
    expect(ds.projects).toHaveLength(30)
    const partyIds = new Set(ds.parties.map((p) => p.id))
    for (const p of ds.projects) {
      expect(partyIds.has(p.clientId)).toBe(true)
    }
  })

  it('keeps transaction lists empty until later tasks fill them', () => {
    const ds = build()
    expect(ds.claimHeaders).toEqual([])
    expect(ds.costTransactions).toEqual([])
    expect(ds.auditEvents).toEqual([])
  })

  it('generates contracts, work packages and commercial changes', () => {
    const ds = build()
    expect(ds.contracts).toHaveLength(30)
    expect(ds.workPackages.length).toBeGreaterThan(0)
    expect(ds.commercialChanges.length).toBeGreaterThan(0)
  })

  it('round-trips through serialization', () => {
    const ds = build()
    expect(JSON.parse(serializeBaseline(ds))).toEqual(ds)
  })

  it('fails closed on a dangling clientId', () => {
    const catalogs = loadCatalogs()
    const broken = {
      ...catalogs,
      projects: catalogs.projects.map((p, i) => (i === 0 ? { ...p, clientId: 'c-missing' } : p)),
    }
    expect(() => generateBaseline(loadSeedConfig(), broken)).toThrow(SeedEngineError)
  })

  it('fails closed when project count drifts from targets', () => {
    const catalogs = loadCatalogs()
    const broken = { ...catalogs, projects: catalogs.projects.slice(1) }
    expect(() => generateBaseline(loadSeedConfig(), broken)).toThrow(SeedEngineError)
  })

  it('validates duplicate ids', () => {
    const catalogs = loadCatalogs()
    const broken = {
      ...catalogs,
      clients: [...catalogs.clients, { ...catalogs.clients[0] }],
    }
    expect(() => validateCatalogs(parseSeedConfig(loadSeedConfig()), broken)).toThrow(SeedEngineError)
  })
})

describe('stableStringify', () => {
  it('sorts object keys so equivalent objects serialize identically', () => {
    const a = { z: 1, a: { y: 2, b: 3 } }
    const b = { a: { b: 3, y: 2 }, z: 1 }
    expect(stableStringify(a)).toBe(stableStringify(b))
  })

  it('rejects non-finite numbers', () => {
    expect(() => stableStringify({ x: Number.NaN })).toThrow(SeedEngineError)
    expect(() => stableStringify({ x: Number.POSITIVE_INFINITY })).toThrow(SeedEngineError)
  })
})
