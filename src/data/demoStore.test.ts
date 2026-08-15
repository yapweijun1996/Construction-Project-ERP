import { describe, expect, it } from 'vitest'
import { resetDemoData, clearDemoLocalState, seedInfo } from './demoStore'
import { serializeBaseline } from '../domain/seed/engine'
import { buildBaseline, resetBaselineCache } from './baseline'

describe('demoStore (TASK-013)', () => {
  it('clearDemoLocalState removes only demo:* keys', () => {
    localStorage.setItem('demo:edit-1', 'x')
    localStorage.setItem('other-app:key', 'keep')
    clearDemoLocalState()
    expect(localStorage.getItem('demo:edit-1')).toBeNull()
    expect(localStorage.getItem('other-app:key')).toBe('keep')
    localStorage.removeItem('other-app:key')
  })

  it('resetDemoData recreates the identical deterministic baseline', () => {
    resetBaselineCache()
    const before = serializeBaseline(buildBaseline())
    resetDemoData()
    const after = serializeBaseline(buildBaseline())
    expect(after).toBe(before)
  })

  it('seedInfo reports the configured seed identity', () => {
    const info = seedInfo()
    expect(info.seedVersion).toBe('SG-DEMO-2026.1')
    expect(info.seed).toBe(20260815)
    expect(info.projects).toBe(30)
    expect(info.engineVersion.length).toBeGreaterThan(0)
  })
})
