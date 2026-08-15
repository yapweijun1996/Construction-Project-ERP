/**
 * Seed configuration parsing and fail-closed validation.
 * Reference shape: mock-data/seed-config.example.json.
 */

export interface SeedConfig {
  seedVersion: string
  seed: number
  deterministic: boolean
  demoCompany: string
  country: string
  currency: string
  historyStart: string
  historyEnd: string
  targets: Record<string, unknown>
}

export class SeedConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SeedConfigError'
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function parseSeedConfig(raw: unknown): SeedConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new SeedConfigError('seed config must be an object')
  }
  const o = raw as Record<string, unknown>

  if (typeof o.seed !== 'number' || !Number.isInteger(o.seed) || o.seed < 0 || o.seed > 0xffffffff) {
    throw new SeedConfigError('seed must be an integer between 0 and 4294967295')
  }
  if (typeof o.seedVersion !== 'string' || o.seedVersion.length === 0) {
    throw new SeedConfigError('seedVersion must be a non-empty string')
  }
  if (o.deterministic !== true) {
    throw new SeedConfigError('deterministic must be true for demo baseline generation')
  }
  for (const field of ['demoCompany', 'country', 'currency', 'historyStart', 'historyEnd']) {
    if (typeof o[field] !== 'string' || (o[field] as string).length === 0) {
      throw new SeedConfigError(field + ' must be a non-empty string')
    }
  }
  if (!ISO_DATE.test(o.historyStart as string) || !ISO_DATE.test(o.historyEnd as string)) {
    throw new SeedConfigError('historyStart/historyEnd must be ISO dates (YYYY-MM-DD)')
  }
  if (typeof o.targets !== 'object' || o.targets === null) {
    throw new SeedConfigError('targets must be an object')
  }

  return {
    seedVersion: o.seedVersion as string,
    seed: o.seed as number,
    deterministic: true,
    demoCompany: o.demoCompany as string,
    country: o.country as string,
    currency: o.currency as string,
    historyStart: o.historyStart as string,
    historyEnd: o.historyEnd as string,
    targets: o.targets as Record<string, unknown>,
  }
}

function targetNumber(config: SeedConfig, key: string): number | undefined {
  const v = config.targets[key]
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : undefined
}

function targetRange(config: SeedConfig, key: string): [number, number] | undefined {
  const v = config.targets[key]
  if (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isInteger(n))) {
    return [v[0], v[1]]
  }
  return undefined
}

export function requiredTargets(config: SeedConfig): {
  projects: number
  clientsMin: number
  vendorsSubcontractorsMin: number
} {
  const projects = targetNumber(config, 'projects')
  const clientsMin = targetNumber(config, 'clientsMin')
  const vendorsSubcontractorsMin = targetNumber(config, 'vendorsSubcontractorsMin')
  if (projects === undefined || clientsMin === undefined || vendorsSubcontractorsMin === undefined) {
    throw new SeedConfigError('targets must define numeric projects, clientsMin and vendorsSubcontractorsMin')
  }
  void targetRange // reserved for transaction-range checks in later tasks
  return { projects, clientsMin, vendorsSubcontractorsMin }
}
