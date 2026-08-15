/**
 * TASK-003 Part 4b — retention register.
 *
 * BR-CLAIM-005: retention is explicit. Receivable retention accumulates from
 * client claims; payable retention accumulates from subcontract certifications.
 * Release follows project status (Completed fully released, DLP partially).
 */

import type { ClaimHeader, Project, Retention, Subcontract, SubcontractClaim } from '../../types'
import type { SeedConfig } from '../config'
import { Random } from '../prng'

const round2 = (v: number): number => Math.round(v * 100) / 100 + 0

function releaseRatio(project: Project, rng: Random): number {
  switch (project.status) {
    case 'Completed':
      return 1
    case 'DLP':
      return 0.3 + rng.next() * 0.5
    default:
      return 0
  }
}

export function generateRetentions(
  config: SeedConfig,
  projects: Project[],
  claimHeaders: ClaimHeader[],
  subcontracts: Subcontract[],
  subcontractClaims: SubcontractClaim[],
  rng: Random,
): Retention[] {
  void config
  const retentions: Retention[] = []
  let seq = 0

  const headersByProject = new Map<string, ClaimHeader[]>()
  for (const h of claimHeaders) {
    const list = headersByProject.get(h.projectId) ?? []
    list.push(h)
    headersByProject.set(h.projectId, list)
  }
  const subsByProject = new Map<string, Subcontract[]>()
  for (const s of subcontracts) {
    const list = subsByProject.get(s.projectId) ?? []
    list.push(s)
    subsByProject.set(s.projectId, list)
  }
  const claimsBySub = new Map<string, SubcontractClaim[]>()
  for (const c of subcontractClaims) {
    const list = claimsBySub.get(c.subcontractId) ?? []
    list.push(c)
    claimsBySub.set(c.subcontractId, list)
  }

  for (const project of projects) {
    const receivable = round2(
      (headersByProject.get(project.id) ?? []).reduce((a, h) => a + h.retentionAmount, 0),
    )
    let payable = 0
    for (const sub of subsByProject.get(project.id) ?? []) {
      const certified = (claimsBySub.get(sub.id) ?? []).reduce((a, c) => a + Math.max(0, c.certified), 0)
      payable += round2((certified * sub.retentionPct) / 100)
    }
    payable = round2(payable)
    const ratio = releaseRatio(project, rng)
    const status = ratio === 0 ? 'Active' : ratio === 1 ? 'Released' : 'Partially Released'

    seq += 1
    retentions.push({
      id: 'ret-' + String(seq).padStart(3, '0'),
      projectId: project.id,
      kind: 'receivable',
      amount: receivable,
      releasedAmount: round2(receivable * ratio),
      status,
    })
    seq += 1
    retentions.push({
      id: 'ret-' + String(seq).padStart(3, '0'),
      projectId: project.id,
      kind: 'payable',
      amount: payable,
      releasedAmount: round2(payable * ratio),
      status,
    })
  }

  return retentions
}
