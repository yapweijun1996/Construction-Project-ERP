/**
 * TASK-003 Part 1 — commercial scope generation.
 *
 * Deterministic generation of main contracts, work packages and commercial
 * changes (VO / Omission / Adjustment / Revised PO / Backcharge) from project
 * stories. Business invariants enforced here:
 * - BR-CONTRACT-001/002: adjusted contract = original + signed changes;
 *   work packages may be service, lump-sum, milestone or material.
 * - BR-FULFIL-001/002 (ADR-003): physical material requires DO evidence;
 *   progress-based work is measured, never auto-DO.
 * - SPEC-003: WP carries WBS/trade/location, value, fulfilment type,
 *   billing basis, claimed/certified/remaining.
 *
 * Amounts are SGD rounded to cents; the sum of work-package values equals the
 * contract value exactly (reconciliation-safe).
 */

import type {
  CommercialChange,
  Contract,
  FulfilmentType,
  Project,
  WorkPackage,
} from '../../types'
import type { SeedConfig } from '../config'
import { SeedEngineError } from '../engine'
import { Random } from '../prng'

export interface CommercialOutput {
  contracts: Contract[]
  workPackages: WorkPackage[]
  commercialChanges: CommercialChange[]
}

const TRADES = [
  'Structural Works',
  'Architectural Works',
  'Mechanical & Electrical',
  'Electrical Services',
  'ACMV',
  'Plumbing & Sanitary',
  'Fire Protection',
  'Finishes',
  'External Works',
  'Landscaping',
  'Specialist Systems',
  'General Builder Works',
] as const

const LOCATIONS = [
  'Block A',
  'Block B',
  'Block C',
  'Level 1-4',
  'Level 5-8',
  'Roof',
  'External',
  'Common Areas',
  'Plant Room',
  'Site-wide',
] as const

const WP_DESCRIPTIONS: Record<string, string> = {
  'Structural Works': 'Supply and install structural steel, formwork and reinforcement',
  'Architectural Works': 'Architectural finishes, partitions, ceilings and joinery',
  'Mechanical & Electrical': 'Mechanical and electrical services installation',
  'Electrical Services': 'Electrical containment, cabling and switchgear',
  ACMV: 'Air-conditioning and mechanical ventilation works',
  'Plumbing & Sanitary': 'Plumbing, sanitary fixtures and drainage',
  'Fire Protection': 'Fire protection, sprinkler and alarm systems',
  Finishes: 'Flooring, painting and architectural finishes',
  'External Works': 'External works, roads and drainage',
  Landscaping: 'Soft and hard landscaping',
  'Specialist Systems': 'Specialist systems and controls',
  'General Builder Works': 'General builder works and preliminaries',
}

function workPackageCount(rng: Random, projectValue: number): number {
  if (projectValue >= 50_000_000) return rng.int(55, 70)
  if (projectValue >= 20_000_000) return rng.int(40, 55)
  if (projectValue >= 5_000_000) return rng.int(25, 40)
  return rng.int(12, 24)
}

function changeCount(rng: Random, project: Project): number {
  if (project.scenarios.includes('vo-heavy')) return rng.int(12, 18)
  if (project.scenarios.includes('early-stage')) return rng.int(2, 4)
  if (project.status === 'On Hold') return rng.int(3, 6)
  if (project.status === 'Completed' || project.status === 'DLP') return rng.int(7, 12)
  return rng.int(10, 16)
}

/** Weighted fulfilment-type pool per project story (ADR-003). */
function fulfilmentPool(scenarios: string[]): FulfilmentType[] {
  if (scenarios.includes('physical-material-with-do')) {
    return [
      'physical-material',
      'physical-material',
      'progress-based-work',
      'progress-based-work',
      'progress-based-work',
      'lump-sum-work',
      'professional-service',
    ]
  }
  if (scenarios.includes('progress-work-no-do')) {
    return [
      'progress-based-work',
      'progress-based-work',
      'progress-based-work',
      'lump-sum-work',
      'professional-service',
    ]
  }
  return [
    'progress-based-work',
    'progress-based-work',
    'progress-based-work',
    'progress-based-work',
    'physical-material',
    'lump-sum-work',
    'professional-service',
  ]
}

function billingBasisFor(type: FulfilmentType, rng: Random): string {
  if (type === 'physical-material') return 'quantity'
  if (type === 'milestone') return 'milestone'
  if (type === 'lump-sum-work') return 'lump-sum'
  return rng.pick(['progress-percentage', 'quantity'] as const)
}

/** Exact-reconciliation value split: weights 1/i^0.6, last row absorbs rounding. */
function splitValue(total: number, count: number): number[] {
  const weights: number[] = []
  let sum = 0
  for (let i = 1; i <= count; i++) {
    const w = 1 / Math.pow(i, 0.6)
    weights.push(w)
    sum += w
  }
  const values = weights.map((w) => Math.round(((total * w) / sum) * 100) / 100)
  const allocated = values.slice(0, -1).reduce((a, b) => a + b, 0)
  const last = Math.round((total - allocated) * 100) / 100
  if (last < 0) {
    throw new SeedEngineError('work-package value split produced a negative remainder')
  }
  values[values.length - 1] = last
  return values
}

function changeKindFor(scenarios: string[], rng: Random): string {
  const pool = scenarios.includes('revised-po')
    ? ['VO', 'VO', 'Omission', 'Adjustment', 'Revised PO', 'Revised PO', 'Backcharge']
    : ['VO', 'VO', 'VO', 'Omission', 'Adjustment', 'Revised PO', 'Backcharge']
  return rng.pick(pool)
}

export function generateCommercial(config: SeedConfig, projects: Project[], rng: Random): CommercialOutput {
  void config
  const contracts: Contract[] = []
  const workPackages: WorkPackage[] = []
  const commercialChanges: CommercialChange[] = []

  let contractSeq = 0
  let wpSeq = 0
  let changeSeq = 0

  for (const project of projects) {
    contractSeq += 1
    const contractId = 'ct-' + String(contractSeq).padStart(3, '0')
    contracts.push({
      id: contractId,
      projectId: project.id,
      code: project.code + '-MC01',
      kind: 'main',
      originalValue: project.originalContractValue,
      currency: project.currency,
      status: 'Awarded',
    })

    // ---- work packages ----
    const count = workPackageCount(rng, project.originalContractValue)
    const values = splitValue(project.originalContractValue, count)
    const pool = fulfilmentPool(project.scenarios)
    const milestoneCount = project.scenarios.includes('milestone') ? rng.int(2, 4) : 0
    for (let i = 0; i < count; i++) {
      wpSeq += 1
      let type: FulfilmentType = rng.pick(pool)
      if (i < milestoneCount) type = 'milestone'
      const trade = rng.pick(TRADES)
      workPackages.push({
        id: 'wp-' + String(wpSeq).padStart(5, '0'),
        contractId,
        projectId: project.id,
        code: 'WP-' + String(i + 1).padStart(3, '0'),
        description: WP_DESCRIPTIONS[trade],
        wbs: '1.' + (i + 1),
        trade,
        location: rng.pick(LOCATIONS),
        value: values[i],
        fulfilmentType: type,
        billingBasis: billingBasisFor(type, rng),
        doRequired: type === 'physical-material',
        claimed: 0,
        certified: 0,
        remaining: values[i],
      })
    }

    // ---- commercial changes ----
    const changeTotal = changeCount(rng, project)
    const pendingCutoff = project.scenarios.includes('vo-pending') ? changeTotal - rng.int(1, 2) : changeTotal
    for (let i = 0; i < changeTotal; i++) {
      changeSeq += 1
      const kind = changeKindFor(project.scenarios, rng)
      const scale = project.originalContractValue
      let value: number
      let description: string
      switch (kind) {
        case 'VO':
          value = rng.money(scale * 0.005, scale * 0.08)
          description = 'Variation order: ' + WP_DESCRIPTIONS[rng.pick(TRADES)]
          break
        case 'Omission':
          value = -rng.money(scale * 0.005, scale * 0.05)
          description = 'Omission of scope: ' + rng.pick(TRADES).toLowerCase()
          break
        case 'Adjustment':
          value = rng.bool() ? rng.money(scale * 0.002, scale * 0.03) : -rng.money(scale * 0.002, scale * 0.03)
          description = 'Rate adjustment: ' + rng.pick(TRADES).toLowerCase()
          break
        case 'Revised PO':
          value = rng.money(scale * 0.01, scale * 0.1)
          description = 'Revised customer purchase order'
          break
        default:
          value = -rng.money(scale * 0.002, scale * 0.03)
          description = 'Backcharge contra: ' + rng.pick(TRADES).toLowerCase()
          break
      }
      commercialChanges.push({
        id: 'ch-' + String(changeSeq).padStart(5, '0'),
        contractId,
        projectId: project.id,
        code: 'CH-' + String(i + 1).padStart(3, '0'),
        kind: kind as CommercialChange['kind'],
        description,
        signedValue: Math.round(value * 100) / 100,
        status: i < pendingCutoff ? 'Approved' : 'Pending',
      })
    }
  }

  return { contracts, workPackages, commercialChanges }
}
