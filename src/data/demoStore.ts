/**
 * TASK-013 — demo reset (SPEC-010 / DEMO-RESET.md).
 *
 * Reset clears only this app's local namespace (localStorage 'demo:*' keys
 * and the demo IndexedDB when introduced), then recreates the deterministic
 * baseline from the seed. It never touches other sites' storage.
 */

import { buildBaseline, resetBaselineCache } from './baseline'

const DEMO_PREFIX = 'demo:'

export function clearDemoLocalState(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(DEMO_PREFIX)) keys.push(key)
    }
    for (const key of keys) localStorage.removeItem(key)
  } catch {
    // storage unavailable (private mode etc.) — baseline is still deterministic
  }
}

export function resetDemoData(): void {
  clearDemoLocalState()
  resetBaselineCache()
  buildBaseline() // recreate the identical seeded baseline
}

export function seedInfo(): { seedVersion: string; seed: number; engineVersion: string; projects: number } {
  const ds = buildBaseline()
  return {
    seedVersion: ds.meta.seedVersion,
    seed: ds.meta.seed,
    engineVersion: ds.meta.engineVersion,
    projects: ds.projects.length,
  }
}
