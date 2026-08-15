/**
 * Loads the canonical mock-data catalogs and seed config.
 * mock-data/ is the single source of truth for the demo baseline.
 */

import clientsRaw from '../../mock-data/clients.catalog.json'
import vendorsRaw from '../../mock-data/vendors.catalog.json'
import projectsRaw from '../../mock-data/projects.catalog.json'
import seedConfigRaw from '../../mock-data/seed-config.json'

import type { CatalogInputs, RawClient, RawProjectStory, RawVendor } from '../domain/seed/engine'

export function loadSeedConfig(): unknown {
  return seedConfigRaw
}

export function loadCatalogs(): CatalogInputs {
  return {
    clients: clientsRaw as unknown as RawClient[],
    vendors: vendorsRaw as unknown as RawVendor[],
    projects: projectsRaw as unknown as RawProjectStory[],
  }
}
