/**
 * Cached baseline build. The dataset is deterministic and immutable for a
 * given seed, so it is generated once per session and reused everywhere.
 */

import { loadCatalogs, loadSeedConfig } from './loadCatalogs'
import { generateBaseline } from '../domain/seed/engine'
import type { BaselineDataset } from '../domain/types'

let cached: BaselineDataset | null = null

export function buildBaseline(): BaselineDataset {
  if (!cached) {
    cached = generateBaseline(loadSeedConfig(), loadCatalogs())
  }
  return cached
}

/** Test helper: clears the cached baseline. */
export function resetBaselineCache(): void {
  cached = null
}
