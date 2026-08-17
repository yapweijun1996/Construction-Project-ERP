import { beforeEach, describe, expect, it } from 'vitest'
import { loadCatalogs, loadSeedConfig } from '../data/loadCatalogs'
import { generateBaseline } from './seed/engine'
import {
  addLocalChange,
  applyLocalEdits,
  emptyEdits,
  loadLocalEdits,
  LocalEditError,
  removeLocalChange,
  saveLocalEdits,
  validateLocalChangeDraft,
} from './edits'
import type { BaselineDataset } from './types'

function build(): BaselineDataset {
  return generateBaseline(loadSeedConfig(), loadCatalogs())
}

beforeEach(() => {
  localStorage.removeItem('demo:edits')
})

const project = build().projects[0]

const draft = {
  projectId: project.id,
  contractId: 'ct-001',
  kind: 'VO' as const,
  description: 'User test variation',
  signedValue: 250000,
  status: 'Approved' as const,
}

describe('local edit store', () => {
  it('round-trips through localStorage', () => {
    const store = addLocalChange(emptyEdits(), draft)
    saveLocalEdits(store)
    const loaded = loadLocalEdits()
    expect(loaded.commercialChanges).toHaveLength(1)
    expect(loaded.commercialChanges[0].description).toBe('User test variation')
  })

  it('assigns stable sequential ids', () => {
    const s1 = addLocalChange(emptyEdits(), draft)
    const s2 = addLocalChange(s1, { ...draft, description: 'second' })
    expect(s1.commercialChanges[0].id).toBe('ch-user-001')
    expect(s2.commercialChanges[1].id).toBe('ch-user-002')
  })

  it('drops malformed persisted entries fail-closed', () => {
    localStorage.setItem('demo:edits', JSON.stringify({ commercialChanges: [{ id: 'x' }, { id: 'y', signedValue: NaN }] }))
    expect(loadLocalEdits().commercialChanges).toHaveLength(0)
  })

  it('removes edits by id', () => {
    const store = addLocalChange(emptyEdits(), draft)
    expect(removeLocalChange(store, 'ch-user-001').commercialChanges).toHaveLength(0)
  })
})

describe('draft validation', () => {
  it('rejects unknown kinds and empty descriptions', () => {
    expect(() => validateLocalChangeDraft({ ...draft, kind: 'Nope' as never })).toThrow(LocalEditError)
    expect(() => validateLocalChangeDraft({ ...draft, description: '  ' })).toThrow(LocalEditError)
  })

  it('enforces sign conventions', () => {
    expect(() => validateLocalChangeDraft({ ...draft, kind: 'VO', signedValue: -1 })).toThrow(LocalEditError)
    expect(() => validateLocalChangeDraft({ ...draft, kind: 'Omission', signedValue: 1 })).toThrow(LocalEditError)
    expect(() => validateLocalChangeDraft({ ...draft, kind: 'Backcharge', signedValue: 5 })).toThrow(LocalEditError)
    expect(() => validateLocalChangeDraft({ ...draft, signedValue: 0 })).toThrow(LocalEditError)
  })
})

describe('applyLocalEdits', () => {
  it('does not mutate the baseline', () => {
    const baseline = build()
    const store = addLocalChange(emptyEdits(), draft)
    const merged = applyLocalEdits(baseline, store)
    expect(merged.commercialChanges.length).toBe(baseline.commercialChanges.length + 1)
    expect(baseline.commercialChanges).toHaveLength(baseline.commercialChanges.length)
    expect(merged).not.toBe(baseline)
  })

  it('returns the baseline unchanged when there are no edits', () => {
    const baseline = build()
    expect(applyLocalEdits(baseline, emptyEdits())).toBe(baseline)
  })

  it('appends user changes with sequential codes', () => {
    const baseline = build()
    const store = addLocalChange(addLocalChange(emptyEdits(), draft), { ...draft, description: 'second' })
    const merged = applyLocalEdits(baseline, store)
    const user = merged.commercialChanges.slice(-2)
    expect(user[0].code).toBe('CH-L001')
    expect(user[1].code).toBe('CH-L002')
    expect(user[0].status).toBe('Approved')
  })
})
