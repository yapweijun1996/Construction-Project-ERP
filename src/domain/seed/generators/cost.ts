/**
 * TASK-003 Part 4a — cost transactions and POC snapshots.
 *
 * BR-COST-001: claim progress != accounting POC. Cost-based POC derives from
 * accumulated actual cost against a deterministic forecast; physical, claim,
 * certification and collection percentages are tracked as distinct measures
 * (SPEC-008).
 *
 * Cost drivers: purchase orders (material/equipment), subcontract
 * certifications, monthly payroll and site overheads, scaled by scenario
 * (cost-overrun / margin-pressure inflate actuals and forecast).
 */

import type {
  Certification,
  ClaimHeader,
  CostTransaction,
  PocSnapshot,
  ProgressMeasurement,
  Project,
  PurchaseOrder,
  Receipt,
  Subcontract,
  SubcontractClaim,
} from '../../types'
import type { SeedConfig } from '../config'
import { Random } from '../prng'

export interface CostOutput {
  costTransactions: CostTransaction[]
  pocSnapshots: PocSnapshot[]
}

const round2 = (v: number): number => Math.round(v * 100) / 100 + 0

function scenarioFactor(scenarios: string[]): number {
  if (scenarios.includes('cost-overrun')) return 1.1
  if (scenarios.includes('margin-pressure')) return 1.05
  return 1
}

function forecastFactor(scenarios: string[], rng: Random): number {
  if (scenarios.includes('cost-overrun')) return 1.12 + rng.next() * 0.13
  if (scenarios.includes('margin-pressure')) return 1.04 + rng.next() * 0.06
  return 0.96 + rng.next() * 0.08
}

export function generateCost(
  config: SeedConfig,
  projects: Project[],
  purchaseOrders: PurchaseOrder[],
  subcontracts: Subcontract[],
  subcontractClaims: SubcontractClaim[],
  progressMeasurements: ProgressMeasurement[],
  claimHeaders: ClaimHeader[],
  certifications: Certification[],
  receipts: Receipt[],
  costRng: Random,
  pocRng: Random,
): CostOutput {
  void config
  const costTransactions: CostTransaction[] = []
  const pocSnapshots: PocSnapshot[] = []
  let txSeq = 0
  let snapSeq = 0

  const posByProject = new Map<string, PurchaseOrder[]>()
  for (const po of purchaseOrders) {
    const list = posByProject.get(po.projectId) ?? []
    list.push(po)
    posByProject.set(po.projectId, list)
  }
  const subsByProject = new Map<string, Subcontract[]>()
  for (const s of subcontracts) {
    const list = subsByProject.get(s.projectId) ?? []
    list.push(s)
    subsByProject.set(s.projectId, list)
  }
  const subClaimBySub = new Map<string, SubcontractClaim[]>()
  for (const c of subcontractClaims) {
    const list = subClaimBySub.get(c.subcontractId) ?? []
    list.push(c)
    subClaimBySub.set(c.subcontractId, list)
  }
  const headersByProject = new Map<string, ClaimHeader[]>()
  for (const h of claimHeaders) {
    const list = headersByProject.get(h.projectId) ?? []
    list.push(h)
    headersByProject.set(h.projectId, list)
  }
  const measurementsByProject = new Map<string, ProgressMeasurement[]>()
  for (const m of progressMeasurements) {
    const list = measurementsByProject.get(m.projectId) ?? []
    list.push(m)
    measurementsByProject.set(m.projectId, list)
  }
  const certsByProject = new Map<string, Certification[]>()
  for (const c of certifications) {
    const list = certsByProject.get(c.projectId) ?? []
    list.push(c)
    certsByProject.set(c.projectId, list)
  }
  const receiptsByProject = new Map<string, Receipt[]>()
  for (const r of receipts) {
    const list = receiptsByProject.get(r.projectId) ?? []
    list.push(r)
    receiptsByProject.set(r.projectId, list)
  }

  const pushTx = (projectId: string, category: string, amount: number, at: string, source: string) => {
    txSeq += 1
    costTransactions.push({
      id: 'ctx-' + String(txSeq).padStart(6, '0'),
      projectId,
      category,
      amount: round2(Math.max(0, amount)),
      occurredAt: at,
      source,
    })
  }

  for (const project of projects) {
    const factor = scenarioFactor(project.scenarios)
    const monthlyLabour = project.originalContractValue * 0.003

    // ---- payroll per active month ----
    const activeMonths = new Set<string>()
    for (const h of headersByProject.get(project.id) ?? []) activeMonths.add(h.period)
    for (const ym of activeMonths) {
      const count = costRng.int(11, 17)
      for (let i = 0; i < count; i++) {
        pushTx(
          project.id,
          'labour',
          (monthlyLabour / count) * factor * (0.5 + costRng.next()),
          ym + '-' + String(costRng.int(1, 28)).padStart(2, '0'),
          'payroll-' + ym,
        )
      }
      for (let i = 0; i < costRng.int(2, 4); i++) {
        pushTx(
          project.id,
          costRng.pick(['site-overheads', 'consultant'] as const),
          project.originalContractValue * (0.0002 + costRng.next() * 0.0006) * factor,
          ym + '-' + String(costRng.int(1, 28)).padStart(2, '0'),
          'expense-' + ym,
        )
      }
    }

    // ---- material/equipment from purchase orders ----
    for (const po of posByProject.get(project.id) ?? []) {
      const split = 0.45 + costRng.next() * 0.1
      pushTx(project.id, 'material', po.amount * split * factor, po.issuedAt, po.id)
      pushTx(project.id, 'equipment', po.amount * (1 - split) * factor, po.issuedAt, po.id)
    }

    // ---- subcontract certifications ----
    for (const sub of subsByProject.get(project.id) ?? []) {
      for (const claim of subClaimBySub.get(sub.id) ?? []) {
        if (claim.certified > 0) {
          pushTx(project.id, 'subcontract', claim.certified * factor, claim.period + '-20', claim.id)
        }
      }
    }

    // ---- POC snapshots per measured month ----
    const forecast = round2(project.originalContractValue * forecastFactor(project.scenarios, pocRng))
    const measurements = measurementsByProject.get(project.id) ?? []
    const receiptsAll = receiptsByProject.get(project.id) ?? []
    const txList = costTransactions.filter((t) => t.projectId === project.id)

    let prevFinancial = { cost: 0, claim: 0, cert: 0, collected: 0 }
    for (const m of measurements) {
      const actualToDate = txList.filter((t) => t.occurredAt.slice(0, 7) <= m.period).reduce((a, t) => a + t.amount, 0)
      const header = [...(headersByProject.get(project.id) ?? [])].reverse().find((h) => h.period <= m.period)
      const cert = [...(certsByProject.get(project.id) ?? [])].reverse().find((c) => {
        const h = claimHeaders.find((hh) => hh.id === c.claimId)
        return h !== undefined && h.period <= m.period
      })
      const collected = receiptsAll.filter((r) => r.receivedAt.slice(0, 7) <= m.period).reduce((a, r) => a + r.amount, 0)
      const isPlan = m.kind === 'plan'
      // plan snapshots carry the physical target with prior-month financials;
      // actual snapshots update every measure.
      const financial = isPlan
        ? prevFinancial
        : {
            cost: round2(Math.min(100, (actualToDate / forecast) * 100)),
            claim: round2(header ? Math.min(120, (header.currentCumulativeEntitlement / project.originalContractValue) * 100) : 0),
            cert: round2(cert ? Math.min(120, (cert.certifiedAmount / project.originalContractValue) * 100) : 0),
            collected: round2(Math.min(120, (collected / project.originalContractValue) * 100)),
          }
      if (!isPlan) prevFinancial = financial
      snapSeq += 1
      pocSnapshots.push({
        id: 'poc-' + String(snapSeq).padStart(4, '0'),
        projectId: project.id,
        period: m.period,
        costPocPct: financial.cost,
        forecastFinalCost: forecast,
        physicalPct: round2(m.cumulativePct),
        claimPct: financial.claim,
        certPct: financial.cert,
        collectedPct: financial.collected,
        kind: m.kind,
      })
    }
  }

  return { costTransactions, pocSnapshots }
}
