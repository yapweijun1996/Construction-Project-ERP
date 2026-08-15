/**
 * Project KPI derivation (SPEC-002 workspace KPIs).
 *
 * ARCHITECTURE.md: business calculations live in domain code — the UI renders
 * these values and never recomputes them. Amounts are SGD.
 */

import type { BaselineDataset, Project } from './types'

export interface ProjectKpis {
  projectId: string
  originalContract: number
  approvedChanges: number
  adjustedContract: number
  /** Latest cumulative entitlement (Work Done == cumulative claimed). */
  workDone: number
  claimed: number
  /** Latest cumulative certified amount. */
  certified: number
  billed: number
  credits: number
  collected: number
  /** Net AR exposure = billed + credits (negative) - collected. */
  ar: number
  budget: number
  actual: number
  forecast: number
  /** Accounting (cost-based) POC — distinct from claim progress (BR-COST-001). */
  poc: number
  /** Forecast margin = (adjusted - forecast) / adjusted. */
  marginPct: number
  /** Committed = sum of purchase/subcontract orders (SPEC-008). */
  committed: number
  /** Revised budget follows approved commercial changes. */
  revisedBudget: number
  /** Forecast final cost minus actual to date. */
  costToComplete: number
  /** Revised budget minus forecast final cost (negative = overrun). */
  variance: number
  /** Cost-based recognised revenue = adjusted contract × POC. */
  recognizedRevenue: number
  /** Forecast gross profit = adjusted - forecast. */
  grossProfit: number
}

const round2 = (v: number): number => Math.round(v * 100) / 100 + 0

export function computeProjectKpis(ds: BaselineDataset, project: Project): ProjectKpis {
  const contract = ds.contracts.find((c) => c.projectId === project.id)
  const changes = ds.commercialChanges.filter((c) => c.projectId === project.id && c.status === 'Approved')
  const headers = ds.claimHeaders.filter((h) => h.projectId === project.id)
  const certs = ds.certifications.filter((c) => c.projectId === project.id)
  const arDocs = ds.arDocuments.filter((d) => d.projectId === project.id)
  const receipts = ds.receipts.filter((r) => r.projectId === project.id)
  const costs = ds.costTransactions.filter((t) => t.projectId === project.id)
  const snaps = ds.pocSnapshots.filter((s) => s.projectId === project.id && s.kind === 'actual')

  const originalContract = contract?.originalValue ?? project.originalContractValue
  const approvedChanges = round2(changes.reduce((a, c) => a + c.signedValue, 0))
  const adjustedContract = round2(originalContract + approvedChanges)

  const latestHeader = headers.length > 0 ? headers.reduce((a, b) => (a.period > b.period ? a : b)) : undefined
  const workDone = latestHeader ? latestHeader.currentCumulativeEntitlement : 0

  // certifications carry cumulative amounts; use the highest cumulative seen
  const certified = Math.max(0, certs.reduce((a, c) => Math.max(a, c.certifiedAmount), 0))

  const billed = round2(arDocs.filter((d) => d.kind === 'invoice').reduce((a, d) => a + d.total, 0))
  const credits = round2(arDocs.filter((d) => d.kind === 'credit-note').reduce((a, d) => a + d.total, 0))
  const collected = round2(receipts.reduce((a, r) => a + r.amount, 0))
  const ar = round2(billed + credits - collected)

  const budget = originalContract
  const actual = round2(costs.reduce((a, t) => a + t.amount, 0))
  const committed = round2(ds.purchaseOrders.filter((po) => po.projectId === project.id).reduce((a, po) => a + po.amount, 0))
  const latestSnap = snaps.length > 0 ? snaps.reduce((a, b) => (a.period > b.period ? a : b)) : undefined
  const forecast = latestSnap ? latestSnap.forecastFinalCost : round2(originalContract)
  const poc = latestSnap ? latestSnap.costPocPct : 0
  const marginPct = adjustedContract > 0 ? round2(((adjustedContract - forecast) / adjustedContract) * 100) : 0
  const revisedBudget = adjustedContract
  const costToComplete = round2(forecast - actual)
  const variance = round2(revisedBudget - forecast)
  const recognizedRevenue = round2((adjustedContract * poc) / 100)
  const grossProfit = round2(adjustedContract - forecast)

  return {
    projectId: project.id,
    originalContract: round2(originalContract),
    approvedChanges,
    adjustedContract,
    workDone: round2(workDone),
    claimed: round2(workDone),
    certified: round2(certified),
    billed,
    credits,
    collected,
    ar,
    budget: round2(budget),
    actual,
    forecast,
    poc,
    marginPct,
    committed,
    revisedBudget: round2(revisedBudget),
    costToComplete,
    variance,
    recognizedRevenue,
    grossProfit,
  }
}

export function formatSgd(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}
