/**
 * TASK-003 Part 2 — progress measurement and the claim cycle.
 *
 * Deterministic monthly generation per project:
 *   progress measurements (plan/actual) -> PCAR (work-package lines) -> CCAR.
 *
 * Business rules honoured (BUSINESS-RULES.md):
 * - BR-CLAIM-001/002 (ADR-004): Current Claim is current-period movement;
 *   cumulative entitlement is derived from work-package cumulative amounts.
 * - BR-CLAIM-003: Previous Certificate is the prior certification, not payment.
 * - BR-CLAIM-004 (ADR-005): claim, certification remain distinct stages.
 * - BR-CLAIM-005: retention and advance recovery are explicit header fields.
 * - BR-CLAIM-006: negative current claims are valid (negative-claim hero).
 * - BR-CERT-001: certified may differ from claimed (partial/zero/hold).
 * - GST follows Singapore rate history by claim year: 7% (2022), 8% (2023), 9% (2024+).
 */

import type {
  Certification,
  ClaimHeader,
  ClaimLine,
  Contract,
  ProgressMeasurement,
  Project,
  WorkPackage,
} from '../../types'
import type { SeedConfig } from '../config'
import { Random } from '../prng'

export interface ClaimsOutput {
  progressMeasurements: ProgressMeasurement[]
  claimHeaders: ClaimHeader[]
  claimLines: ClaimLine[]
  certifications: Certification[]
}

// ---- month helpers (YYYY-MM) ----
function parseYm(ym: string): number {
  return parseInt(ym.slice(0, 4), 10) * 12 + parseInt(ym.slice(5, 7), 10)
}
function formatYm(m: number): string {
  const y = Math.floor((m - 1) / 12)
  const mm = ((m - 1) % 12) + 1
  return y + '-' + String(mm).padStart(2, '0')
}
function ymRange(startYm: string, endYm: string): string[] {
  const out: string[] = []
  for (let m = parseYm(startYm); m <= parseYm(endYm); m++) out.push(formatYm(m))
  return out
}
const monthEnd = (ym: string): string => ym + '-28'

function gstForYear(year: number): number {
  if (year <= 2022) return 7
  if (year === 2023) return 8
  return 9
}

// +0 normalises negative zero so serialisation round-trips cleanly
const round2 = (v: number): number => Math.round(v * 100) / 100 + 0

interface Timeline {
  project: Project
  months: string[]
  claimMonths: string[]
  finalPct: number
}

function buildTimeline(project: Project, historyEndYm: string, rng: Random): Timeline {
  const startYm = project.startDate.slice(0, 7)
  const plannedYm = project.plannedCompletionDate.slice(0, 7)
  let endYm: string
  let finalPct: number
  switch (project.status) {
    case 'Completed':
      endYm = formatYm(parseYm(plannedYm) + rng.int(-1, 2))
      finalPct = 100
      break
    case 'DLP':
      endYm = plannedYm
      finalPct = 100
      break
    case 'Final Account Dispute':
      endYm = formatYm(parseYm(plannedYm) + rng.int(0, 1))
      finalPct = 100
      break
    case 'On Hold':
      endYm = formatYm(parseYm(startYm) + rng.int(8, 14))
      finalPct = rng.int(30, 55)
      break
    case 'Near Completion':
      endYm = historyEndYm
      finalPct = rng.int(92, 98)
      break
    default: {
      endYm = historyEndYm
      if (project.scenarios.includes('early-stage')) finalPct = rng.int(8, 20)
      else if (project.status === 'At Risk') finalPct = rng.int(35, 70)
      else finalPct = rng.int(45, 90)
      break
    }
  }
  if (parseYm(endYm) > parseYm(historyEndYm)) endYm = historyEndYm
  const months = ymRange(startYm, endYm)

  // Final-account disputes freeze new claims for the tail months.
  let claimMonths = months
  if (project.status === 'Final Account Dispute') {
    const tail = rng.int(2, 4)
    claimMonths = months.slice(0, Math.max(1, months.length - tail))
  }

  return { project, months, claimMonths, finalPct }
}

interface WpState {
  wp: WorkPackage
  lag: number
  pct: number
  amount: number
}

/** Monotonic S-ish curve: t^1.3, jittered but never decreasing. */
function projectPctAt(index: number, count: number, finalPct: number, rng: Random, previous: number): number {
  if (index === count - 1) return finalPct
  const t = count > 1 ? index / (count - 1) : 1
  const base = Math.pow(t, 1.3) * finalPct
  const jitter = rng.next() * 3 - 1.5
  return Math.max(previous, Math.min(finalPct, Math.max(0, base + jitter)))
}

function wpPctFor(state: WpState, projectPct: number, negativeMonth: boolean): number {
  const type = state.wp.fulfilmentType
  let raw: number
  if (type === 'physical-material') {
    raw = projectPct < 40 ? 0 : projectPct < 85 ? 50 : 100
  } else if (type === 'milestone') {
    raw = projectPct < 25 ? 0 : projectPct < 60 ? 50 : 100
  } else {
    raw = projectPct * state.lag
  }
  raw = Math.min(100, Math.max(0, raw))
  if (negativeMonth) return Math.max(0, state.pct - 3) // re-measurement correction: prior value written down
  return Math.max(state.pct, raw) // otherwise monotonic
}

export function generateClaims(
  config: SeedConfig,
  projects: Project[],
  contracts: Contract[],
  workPackages: WorkPackage[],
  progressRng: Random,
  pcarRng: Random,
  ccarRng: Random,
): ClaimsOutput {
  void config
  void contracts

  const progressMeasurements: ProgressMeasurement[] = []
  const claimHeaders: ClaimHeader[] = []
  const claimLines: ClaimLine[] = []
  const certifications: Certification[] = []

  const historyEndYm = '2026-08'
  const wpsByProject = new Map<string, WorkPackage[]>()
  for (const wp of workPackages) {
    const list = wpsByProject.get(wp.projectId) ?? []
    list.push(wp)
    wpsByProject.set(wp.projectId, list)
  }

  let claimSeq = 0
  let certSeq = 0
  let lineSeq = 0
  let measSeq = 0

  for (const project of projects) {
    const timeline = buildTimeline(project, historyEndYm, progressRng)
    const wps = wpsByProject.get(project.id) ?? []
    if (wps.length === 0) continue

    const states: WpState[] = wps.map((wp) => ({ wp, lag: 0.85 + pcarRng.next() * 0.3, pct: 0, amount: 0 }))
    const bigProject = project.originalContractValue >= 20_000_000
    const negativeMonthIndex =
      project.scenarios.includes('negative-claim') && timeline.claimMonths.length >= 4
        ? pcarRng.int(Math.floor(timeline.claimMonths.length * 0.5), Math.floor(timeline.claimMonths.length * 0.75))
        : -1

    const isHoldHeavy =
      project.scenarios.includes('on-hold') || project.scenarios.includes('retention-heavy')
    const gapProject = project.scenarios.includes('certification-gap')
    const advanceActive = project.originalContractValue >= 30_000_000 && pcarRng.bool(0.35)

    let projectPct = 0
    let lastCertified = 0

    timeline.months.forEach((ym, idx) => {
      const previousPct = projectPct
      projectPct = projectPctAt(idx, timeline.months.length, timeline.finalPct, pcarRng, projectPct)

      // ---- progress measurements: plan (big projects) + actual ----
      if (bigProject) {
        measSeq += 1
        progressMeasurements.push({
          id: 'pm-' + String(measSeq).padStart(5, '0'),
          projectId: project.id,
          period: ym,
          measuredAt: monthEnd(ym),
          cumulativePct: Math.min(100, Math.max(previousPct, projectPct + 1 + progressRng.next() * 2)),
          kind: 'plan',
        })
      }
      measSeq += 1
      progressMeasurements.push({
        id: 'pm-' + String(measSeq).padStart(5, '0'),
        projectId: project.id,
        period: ym,
        measuredAt: monthEnd(ym),
        cumulativePct: projectPct,
        kind: 'actual',
      })

      if (!timeline.claimMonths.includes(ym)) return

      // ---- PCAR ----
      const negativeMonth = idx === negativeMonthIndex
      const year = parseInt(ym.slice(0, 4), 10)
      claimSeq += 1
      const headerId = 'pcar-' + String(claimSeq).padStart(4, '0')

      let entitlement = 0
      const lines: ClaimLine[] = []
      for (const state of states) {
        const priorPct = state.pct
        const priorAmount = state.amount
        const pct = wpPctFor(state, projectPct, negativeMonth)
        const amount = round2((pct / 100) * state.wp.value)
        state.pct = pct
        state.amount = amount
        entitlement += amount
        lineSeq += 1
        lines.push({
          id: 'cl-' + String(lineSeq).padStart(7, '0'),
          headerId,
          workPackageId: state.wp.id,
          priorCumulativePct: round2(priorPct),
          currentCumulativePct: round2(pct),
          priorAmount,
          currentAmount: amount,
          thisPeriodMovement: round2(amount - priorAmount),
        })
      }

      const currentCumulativeEntitlement = round2(entitlement)
      const thisClaimExGst = round2(currentCumulativeEntitlement - lastCertified)
      const gstRatePct = gstForYear(year)
      const gst = round2((thisClaimExGst * gstRatePct) / 100)
      const retentionPct = thisClaimExGst > 0 ? project.retentionPct : 0
      const retentionAmount = round2((thisClaimExGst * retentionPct) / 100)
      const advanceRecovery =
        advanceActive && idx < 6 && thisClaimExGst > 0 ? round2(thisClaimExGst * 0.05) : 0

      claimHeaders.push({
        id: headerId,
        projectId: project.id,
        claimNo: project.code + '-PCAR-' + String(idx + 1).padStart(2, '0'),
        period: ym,
        status: 'Submitted',
        currentCumulativeEntitlement,
        previousCertified: round2(lastCertified),
        thisClaimExGst,
        gstRatePct,
        gst,
        total: round2(thisClaimExGst + gst),
        retentionPct,
        retentionAmount,
        advanceRecovery,
      })

      for (const line of lines) claimLines.push(line)

      // ---- CCAR (certifiedAmount is CUMULATIVE — BR-CLAIM-003) ----
      const skipCert = gapProject && ccarRng.bool(0.35)
      if (skipCert) return

      certSeq += 1
      let certIncrement: number
      let onHoldAmount = 0
      let remarks = ''
      const roll = ccarRng.next()
      if (thisClaimExGst < 0) {
        // Negative certification (ADR-008): reduces cumulative certified.
        certIncrement = roll < 0.7 ? thisClaimExGst : round2(thisClaimExGst * (0.5 + ccarRng.next() * 0.4))
        onHoldAmount = 0
        remarks = 'Negative certification — AR credit intent to follow'
      } else if (roll < (isHoldHeavy ? 0.45 : 0.1)) {
        const holdRoll = ccarRng.next()
        if (holdRoll < 0.35) {
          certIncrement = 0
          onHoldAmount = thisClaimExGst
          remarks = 'Certification withheld pending supporting evidence'
        } else {
          certIncrement = round2(thisClaimExGst * (0.85 + ccarRng.next() * 0.1))
          onHoldAmount = round2(thisClaimExGst - certIncrement)
          remarks = 'Partial hold: documentation under review'
        }
      } else {
        certIncrement = thisClaimExGst
        onHoldAmount = 0
        remarks = ''
      }

      const certifiedAmount = round2(lastCertified + certIncrement)
      const status =
        certIncrement === thisClaimExGst
          ? 'Certified'
          : certIncrement === 0
            ? 'On Hold'
            : 'Partially Certified'

      certifications.push({
        id: 'ccar-' + String(certSeq).padStart(4, '0'),
        projectId: project.id,
        claimId: headerId,
        certNo: project.code + '-CCAR-' + String(certSeq).padStart(2, '0'),
        status,
        certifiedAmount,
        onHoldAmount: round2(onHoldAmount),
        remarks,
      })
      lastCertified = certifiedAmount
    })
  }

  return { progressMeasurements, claimHeaders, claimLines, certifications }
}
