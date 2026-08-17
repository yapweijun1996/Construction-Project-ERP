/**
 * Cached baseline build. The dataset is deterministic and immutable for a
 * given seed, so it is generated once per session and reused everywhere.
 */

import { loadCatalogs, loadSeedConfig } from './loadCatalogs'
import { generateBaseline } from '../domain/seed/engine'
import { applyLocalEdits, loadLocalEdits } from '../domain/edits'
import type { BaselineDataset } from '../domain/types'

let cached: BaselineDataset | null = null

/**
 * The merged view: immutable seed baseline plus local user edits
 * (BR-CONTRACT-003 — edits append, never overwrite the baseline).
 */
export function buildBaseline(): BaselineDataset {
  if (!cached) {
    cached = generateBaseline(loadSeedConfig(), loadCatalogs())
  }
  return applyLocalEdits(cached, loadLocalEdits())
}

/** Test helper: clears the cached baseline. */
export function resetBaselineCache(): void {
  cached = null
}
