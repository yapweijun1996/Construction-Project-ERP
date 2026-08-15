/**
 * Deterministic baseline generation pipeline.
 *
 * Stage skeleton per docs/02-architecture/DEMO-DATA-ENGINE.md:
 *   seed-config -> parties -> project stories -> contracts/work packages ->
 *   monthly progress -> PCAR/CCAR -> AR/cash -> procurement/subcon ->
 *   cost/POC -> documents/audit.
 *
 * TASK-002 lands the deterministic infrastructure: PRNG streams, catalog
 * validation, party/project materialisation and stable serialisation.
 * Transaction stages are filled by TASK-003 onward; changing any generation
 * logic MUST bump ENGINE_VERSION (a baseline version change).
 */

import type {
  Allocation,
  ArDocument,
  AuditEvent,
  BaselineDataset,
  Certification,
  ClaimHeader,
  ClaimLine,
  CommercialChange,
  Contract,
  CostTransaction,
  DocumentRecord,
  Party,
  PocSnapshot,
  ProgressMeasurement,
  Project,
  PurchaseOrder,
  Receipt,
  Retention,
  Subcontract,
  SubcontractClaim,
  WorkPackage,
} from '../types'
import { parseSeedConfig, requiredTargets, type SeedConfig } from './config'
import { streamRng } from './prng'

export const ENGINE_VERSION = '0.1.0'

export interface RawClient {
  id: string
  name: string
  fictional: boolean
  country: string
}

export interface RawVendor {
  id: string
  name: string
  type: 'supplier' | 'subcontractor'
  fictional: boolean
  country: string
}

export interface RawProjectStory {
  id: string
  projectCode: string
  projectName: string
  projectType: string
  status: string
  startDate: string
  plannedCompletionDate: string
  originalContractValue: number
  currency: string
  clientId: string
  clientName: string
  gstRateAtAwardPct: number
  retentionPct: number
  scenarios: string[]
}

export interface CatalogInputs {
  clients: RawClient[]
  vendors: RawVendor[]
  projects: RawProjectStory[]
}

export class SeedEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SeedEngineError'
  }
}

function uniqueIds(ids: string[], label: string): void {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) throw new SeedEngineError('duplicate ' + label + ' id: ' + id)
    seen.add(id)
  }
}

/** Fail-closed catalog validation: structural invariants only, no invented business rules. */
export function validateCatalogs(config: SeedConfig, catalogs: CatalogInputs): void {
  const { projects, clientsMin, vendorsSubcontractorsMin } = requiredTargets(config)

  if (catalogs.projects.length !== projects) {
    throw new SeedEngineError('catalog has ' + catalogs.projects.length + ' projects, targets require ' + projects)
  }
  if (catalogs.clients.length < clientsMin) {
    throw new SeedEngineError('catalog has ' + catalogs.clients.length + ' clients, targets require >= ' + clientsMin)
  }
  if (catalogs.vendors.length < vendorsSubcontractorsMin) {
    throw new SeedEngineError('catalog has ' + catalogs.vendors.length + ' vendors, targets require >= ' + vendorsSubcontractorsMin)
  }

  uniqueIds(catalogs.clients.map((c) => c.id), 'client')
  uniqueIds(catalogs.vendors.map((v) => v.id), 'vendor')
  uniqueIds(catalogs.projects.map((p) => p.id), 'project')

  const clientIds = new Set(catalogs.clients.map((c) => c.id))
  for (const p of catalogs.projects) {
    if (!clientIds.has(p.clientId)) {
      throw new SeedEngineError('project ' + p.id + ' references missing client ' + p.clientId)
    }
  }
}

export function assembleParties(catalogs: CatalogInputs): Party[] {
  // Catalog order is the stable input order; do not reorder or sort.
  const parties: Party[] = []
  for (const c of catalogs.clients) {
    parties.push({ id: c.id, name: c.name, type: 'client', fictional: c.fictional, country: c.country })
  }
  for (const v of catalogs.vendors) {
    parties.push({ id: v.id, name: v.name, type: v.type, fictional: v.fictional, country: v.country })
  }
  return parties
}

export function materializeProjects(stories: RawProjectStory[]): Project[] {
  return stories.map((s) => ({
    id: s.id,
    code: s.projectCode,
    name: s.projectName,
    projectType: s.projectType,
    status: s.status,
    startDate: s.startDate,
    plannedCompletionDate: s.plannedCompletionDate,
    originalContractValue: s.originalContractValue,
    currency: s.currency,
    gstRateAtAwardPct: s.gstRateAtAwardPct,
    retentionPct: s.retentionPct,
    clientId: s.clientId,
    scenarios: [...s.scenarios],
  }))
}

const EMPTY_LISTS = {
  contracts: [] as Contract[],
  workPackages: [] as WorkPackage[],
  commercialChanges: [] as CommercialChange[],
  progressMeasurements: [] as ProgressMeasurement[],
  claimHeaders: [] as ClaimHeader[],
  claimLines: [] as ClaimLine[],
  certifications: [] as Certification[],
  arDocuments: [] as ArDocument[],
  receipts: [] as Receipt[],
  allocations: [] as Allocation[],
  purchaseOrders: [] as PurchaseOrder[],
  subcontracts: [] as Subcontract[],
  subcontractClaims: [] as SubcontractClaim[],
  costTransactions: [] as CostTransaction[],
  pocSnapshots: [] as PocSnapshot[],
  retentions: [] as Retention[],
  documents: [] as DocumentRecord[],
  auditEvents: [] as AuditEvent[],
}

export function generateBaseline(rawConfig: unknown, catalogs: CatalogInputs): BaselineDataset {
  const config = parseSeedConfig(rawConfig)
  validateCatalogs(config, catalogs)
  // Reserved for stage streams; ensures the baseline stream is used
  // consistently from the very first build.
  streamRng(config.seedVersion, config.seed, 'baseline')

  const parties = assembleParties(catalogs)
  const projects = materializeProjects(catalogs.projects)

  return {
    meta: {
      engineVersion: ENGINE_VERSION,
      seedVersion: config.seedVersion,
      seed: config.seed,
    },
    parties,
    projects,
    ...EMPTY_LISTS,
  }
}

/** Canonical serialisation: sorted keys, stable number formatting. */
export function stableStringify(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    return '[' + value.map((v) => stableStringify(v)).join(',') + ']'
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(record[k])).join(',') + '}'
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new SeedEngineError('non-finite number in baseline')
    return String(value)
  }
  return JSON.stringify(value)
}

export function serializeBaseline(dataset: BaselineDataset): string {
  return stableStringify(dataset)
}
