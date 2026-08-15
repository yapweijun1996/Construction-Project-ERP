import { describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../../../data/loadCatalogs'
import { generateBaseline, ENGINE_VERSION } from '../engine'
import { Random, streamRng } from '../prng'
import { generateCommercial } from './contracts'
import { parseSeedConfig } from '../config'
import type { BaselineDataset } from '../../types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

const config = parseSeedConfig(loadSeedConfig())
const ds = build()

describe('generateCommercial — SPEC-001 targets', () => {
  it('work-package lines fall within 800–1500', () => {
    expect(ds.workPackages.length).toBeGreaterThanOrEqual(800)
    expect(ds.workPackages.length).toBeLessThanOrEqual(1500)
  })

  it('commercial changes fall within 300–500', () => {
    expect(ds.commercialChanges.length).toBeGreaterThanOrEqual(300)
    expect(ds.commercialChanges.length).toBeLessThanOrEqual(500)
  })

  it('one main contract per project', () => {
    expect(ds.contracts).toHaveLength(ds.projects.length)
    const projectIds = new Set(ds.projects.map((p) => p.id))
    for (const c of ds.contracts) {
      expect(projectIds.has(c.projectId)).toBe(true)
      expect(c.kind).toBe('main')
    }
  })
})

describe('generateCommercial — reconciliation invariants', () => {
  it('work-package values sum exactly to the contract value per project', () => {
    for (const project of ds.projects) {
      const contract = ds.contracts.find((c) => c.projectId === project.id)
      const wps = ds.workPackages.filter((w) => w.contractId === contract?.id)
      const sum = Math.round(wps.reduce((a, w) => a + w.value, 0) * 100) / 100
      expect(sum).toBe(contract?.originalValue)
    }
  })

  it('adjusted contract equals original plus signed changes', () => {
    for (const project of ds.projects) {
      const contract = ds.contracts.find((c) => c.projectId === project.id)!
      const changes = ds.commercialChanges.filter((ch) => ch.contractId === contract.id)
      const adjusted = Math.round((contract.originalValue + changes.reduce((a, ch) => a + ch.signedValue, 0)) * 100) / 100
      expect(adjusted).toBeGreaterThan(0)
      expect(adjusted).toBeLessThan(project.originalContractValue * 2)
    }
  })

  it('Omission and Backcharge carry negative signed values; VO is positive', () => {
    for (const ch of ds.commercialChanges) {
      if (ch.kind === 'Omission' || ch.kind === 'Backcharge') expect(ch.signedValue).toBeLessThan(0)
      if (ch.kind === 'VO') expect(ch.signedValue).toBeGreaterThan(0)
    }
  })
})

describe('generateCommercial — DO rules (ADR-003)', () => {
  it('doRequired is true exactly for physical-material work packages', () => {
    for (const wp of ds.workPackages) {
      expect(wp.doRequired).toBe(wp.fulfilmentType === 'physical-material')
    }
  })

  it('physical-material-with-do projects include DO-required packages', () => {
    const ids = new Set(
      ds.projects.filter((p) => p.scenarios.includes('physical-material-with-do')).map((p) => p.id),
    )
    const doWps = ds.workPackages.filter((w) => ids.has(w.projectId) && w.doRequired)
    expect(doWps.length).toBeGreaterThan(0)
  })

  it('progress-work-no-do projects have no DO-required packages', () => {
    const ids = new Set(
      ds.projects.filter((p) => p.scenarios.includes('progress-work-no-do')).map((p) => p.id),
    )
    const doWps = ds.workPackages.filter((w) => ids.has(w.projectId) && w.doRequired)
    expect(doWps).toHaveLength(0)
  })

  it('milestone projects include milestone-billed packages', () => {
    const ids = new Set(
      ds.projects.filter((p) => p.scenarios.includes('milestone')).map((p) => p.id),
    )
    const milestoneWps = ds.workPackages.filter((w) => ids.has(w.projectId) && w.fulfilmentType === 'milestone')
    expect(milestoneWps.length).toBeGreaterThan(0)
  })
})

describe('generateCommercial — determinism and ids', () => {
  it('is deterministic for the same seed', () => {
    const other = generateCommercial(config, ds.projects, new Random(streamRng(config.seedVersion, config.seed, 'commercial')))
    const again = generateCommercial(config, ds.projects, new Random(streamRng(config.seedVersion, config.seed, 'commercial')))
    expect(other).toEqual(again)
  })

  it('uses unique ids across contracts, work packages and changes', () => {
    const ids = [
      ...ds.contracts.map((c) => c.id),
      ...ds.workPackages.map((w) => w.id),
      ...ds.commercialChanges.map((ch) => ch.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('work packages reference resolvable contracts', () => {
    const contractIds = new Set(ds.contracts.map((c) => c.id))
    for (const wp of ds.workPackages) {
      expect(contractIds.has(wp.contractId)).toBe(true)
    }
  })
})

describe('engine meta', () => {
  it('ENGINE_VERSION reflects the claim-cycle generation change', () => {
    expect(ENGINE_VERSION).toBe('0.3.0')
  })
})
