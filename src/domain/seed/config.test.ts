import { describe, expect, it } from 'vitest'
import { parseSeedConfig, requiredTargets, SeedConfigError } from './config'

const valid = {
  seedVersion: 'SG-DEMO-2026.1',
  seed: 20260815,
  deterministic: true,
  demoCompany: 'Meridian Build & Engineering (Demo) Pte. Ltd.',
  country: 'Singapore',
  currency: 'SGD',
  historyStart: '2022-01-01',
  historyEnd: '2026-08-15',
  targets: { projects: 30, clientsMin: 15, vendorsSubcontractorsMin: 80 },
}

describe('parseSeedConfig', () => {
  it('accepts a valid config', () => {
    const c = parseSeedConfig(valid)
    expect(c.seed).toBe(20260815)
    expect(c.seedVersion).toBe('SG-DEMO-2026.1')
    expect(c.deterministic).toBe(true)
  })

  it('rejects a missing or non-numeric seed', () => {
    expect(() => parseSeedConfig({ ...valid, seed: undefined })).toThrow(SeedConfigError)
    expect(() => parseSeedConfig({ ...valid, seed: 1.5 })).toThrow(SeedConfigError)
    expect(() => parseSeedConfig({ ...valid, seed: -1 })).toThrow(SeedConfigError)
    expect(() => parseSeedConfig({ ...valid, seed: 'abc' })).toThrow(SeedConfigError)
  })

  it('rejects an empty seedVersion', () => {
    expect(() => parseSeedConfig({ ...valid, seedVersion: '' })).toThrow(SeedConfigError)
  })

  it('rejects deterministic=false', () => {
    expect(() => parseSeedConfig({ ...valid, deterministic: false })).toThrow(SeedConfigError)
  })

  it('rejects malformed history dates', () => {
    expect(() => parseSeedConfig({ ...valid, historyStart: '01/01/2022' })).toThrow(SeedConfigError)
  })

  it('rejects missing targets', () => {
    expect(() => parseSeedConfig({ ...valid, targets: undefined })).toThrow(SeedConfigError)
  })
})

describe('requiredTargets', () => {
  it('returns numeric targets', () => {
    const t = requiredTargets(parseSeedConfig(valid))
    expect(t).toEqual({ projects: 30, clientsMin: 15, vendorsSubcontractorsMin: 80 })
  })

  it('fails closed on missing numeric targets', () => {
    expect(() => requiredTargets(parseSeedConfig({ ...valid, targets: { projects: 30 } }))).toThrow(SeedConfigError)
  })
})
