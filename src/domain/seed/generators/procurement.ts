/**
 * TASK-003 Part 3b — procurement and subcontract claims.
 *
 * SPEC-007 chain: Subcontract Award -> Subcon Claim -> QS Verification ->
 * Subcon Certificate -> AP/Payment.
 * - claimed and certified are current-period increments; certified <= claimed
 *   except explicit backcharge contras (negative certified).
 * - subcon-overclaim hero: some claims are inflated and verified down.
 */

import type { Party, Project, PurchaseOrder, Subcontract, SubcontractClaim } from '../../types'
import type { SeedConfig } from '../config'
import { Random } from '../prng'

export interface ProcurementOutput {
  purchaseOrders: PurchaseOrder[]
  subcontracts: Subcontract[]
  subcontractClaims: SubcontractClaim[]
}

const round2 = (v: number): number => Math.round(v * 100) / 100 + 0

function poCount(rng: Random, value: number): number {
  if (value >= 50_000_000) return rng.int(45, 60)
  if (value >= 20_000_000) return rng.int(30, 45)
  if (value >= 5_000_000) return rng.int(18, 30)
  return rng.int(8, 15)
}

function subcontractCount(rng: Random, value: number): number {
  if (value >= 50_000_000) return rng.int(5, 8)
  if (value >= 20_000_000) return rng.int(4, 6)
  if (value >= 5_000_000) return rng.int(3, 5)
  return rng.int(1, 3)
}

export function generateProcurement(
  config: SeedConfig,
  projects: Project[],
  parties: Party[],
  procRng: Random,
  subconRng: Random,
): ProcurementOutput {
  void config
  const purchaseOrders: PurchaseOrder[] = []
  const subcontracts: Subcontract[] = []
  const subcontractClaims: SubcontractClaim[] = []

  const suppliers = parties.filter((p) => p.type === 'supplier')
  const subcontractors = parties.filter((p) => p.type === 'subcontractor')
  if (suppliers.length === 0 || subcontractors.length === 0) {
    throw new Error('procurement generation requires supplier and subcontractor parties')
  }

  let poSeq = 0
  let scSeq = 0
  let claimSeq = 0

  for (const project of projects) {
    const startMonth = parseInt(project.startDate.slice(0, 4), 10) * 12 + parseInt(project.startDate.slice(5, 7), 10)
    const monthLabel = (m: number): string => {
      const y = Math.floor((m - 1) / 12)
      const mm = ((m - 1) % 12) + 1
      return y + '-' + String(mm).padStart(2, '0')
    }

    // ---- purchase orders ----
    const poTotal = poCount(procRng, project.originalContractValue)
    const overclaim = project.scenarios.includes('subcon-overclaim')
    for (let i = 0; i < poTotal; i++) {
      poSeq += 1
      const award = procRng.next() < 0.3
      purchaseOrders.push({
        id: 'po-' + String(poSeq).padStart(4, '0'),
        projectId: project.id,
        vendorId: award ? procRng.pick(subcontractors).id : procRng.pick(suppliers).id,
        poNo: project.code + '-PO-' + String(poSeq).padStart(3, '0'),
        kind: award ? 'subcontract-award' : 'po',
        issuedAt: monthLabel(startMonth + procRng.int(0, 6)) + '-15',
        amount: round2(project.originalContractValue * (0.001 + procRng.next() * 0.03)),
        status: procRng.pick(['Issued', 'Delivered', 'Closed'] as const),
      })
    }

    // ---- subcontracts ----
    const scTotal = subcontractCount(subconRng, project.originalContractValue)
    const projectSubs: Subcontract[] = []
    for (let i = 0; i < scTotal; i++) {
      scSeq += 1
      const sub: Subcontract = {
        id: 'sc-' + String(scSeq).padStart(3, '0'),
        projectId: project.id,
        vendorId: subconRng.pick(subcontractors).id,
        code: project.code + '-SC-' + String(i + 1).padStart(2, '0'),
        originalValue: round2(project.originalContractValue * (0.03 + subconRng.next() * 0.09)),
        retentionPct: subconRng.pick([5, 10] as const),
        status: 'Active',
      }
      subcontracts.push(sub)
      projectSubs.push(sub)
    }

    // ---- subcontract claims (current-period increments) ----
    for (const sub of projectSubs) {
      const count = subconRng.int(3, 6)
      const onHoldHeavy = project.status === 'On Hold'
      for (let i = 0; i < count; i++) {
        claimSeq += 1
        let claimed = round2(sub.originalValue * (0.005 + subconRng.next() * 0.025))
        if (overclaim && subconRng.bool(0.4)) claimed = round2(claimed * (1.15 + subconRng.next() * 0.15))
        let certified: number
        let status: string
        if (onHoldHeavy && subconRng.bool(0.5)) {
          certified = 0
          status = 'On Hold'
        } else if (subconRng.bool(0.05)) {
          certified = -round2(claimed * (0.2 + subconRng.next() * 0.5)) // backcharge contra
          status = 'Certified'
        } else {
          certified = round2(claimed * (overclaim ? 0.7 + subconRng.next() * 0.15 : 0.88 + subconRng.next() * 0.12))
          status = 'Certified'
        }
        subcontractClaims.push({
          id: 'scc-' + String(claimSeq).padStart(4, '0'),
          subcontractId: sub.id,
          claimNo: sub.code + '-SCC-' + String(i + 1).padStart(2, '0'),
          period: monthLabel(startMonth + i * 2 + subconRng.int(0, 1)),
          claimed,
          certified: round2(Math.min(claimed, certified)),
          status,
        })
      }
    }
  }

  return { purchaseOrders, subcontracts, subcontractClaims }
}
