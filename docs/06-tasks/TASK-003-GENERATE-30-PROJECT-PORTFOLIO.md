# TASK-003 — Generate 30-Project Portfolio

Status: in progress  
Priority: urgent  
Epic: EPIC-001  
Spec: SPEC-001

## Objective
Generate the full 30-project deterministic transaction baseline from the seed
engine, hitting the SPEC-001 transaction targets. Delivered in stages:
1. Contracts / work packages / commercial changes (done — Part 1).
2. Progress measurements + PCAR/CCAR (done — Part 2).
3. AR / receipts / allocations + procurement / subcontracts (done — Part 3).
4. Cost / POC / documents / audit + full target reconciliation.

## Acceptance
- [ ] Behaviour matches parent SPEC (all transaction targets in SPEC-001).
- [x] Relevant domain/data tests pass (95/95).
- [x] UI task includes browser/mobile evidence when applicable (N/A — data task).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG).

## Evidence (Part 1)
- 30 main contracts; work-package lines and commercial changes within SPEC-001 targets.
- Work-package values sum exactly to contract value per project (reconciliation-safe).
- Adjusted contract = original + signed changes; Omission/Backcharge negative, VO positive.
- ADR-003 respected: doRequired exactly for physical-material; DO-required packages in physical-material-with-do projects; none in progress-work-no-do projects.
- Deterministic byte-for-byte; Vitest 73/73; typecheck and build clean.

## Evidence (Part 2)
- Progress measurements, PCAR and CCAR counts within SPEC-001 target bands.
- ADR-004 arithmetic: This Claim = Cumulative Entitlement − Previous Certified (cumulative); line movements reconcile; entitlement equals sum of line current amounts.
- BR-CLAIM-005: retention and advance recovery are explicit header fields with consistent arithmetic.
- Negative-claim hero: re-measurement write-down produces a negative current claim followed by negative certification (ADR-008).
- Certification-gap hero: fewer CCARs than PCARs; partial/on-hold certification present (BR-CERT-001).
- GST by claim year: 7% (2022), 8% (2023), 9% (2024+).

## Evidence (Part 3)
- AR documents, receipts+allocations, purchase/subcontract orders and subcontract claims within SPEC-001 target bands.
- AR amount equals its CCAR certification increment; credit notes negative; negative-certification projects receive explicit AR credits (ADR-008).
- BR-AR-003: existing credit applied via credit allocations — receipt allocations sum exactly to receipt amount; invoices never over-collected.
- BR-AR-001: Issued / Partially Paid / Settled statuses coexist; late-ar projects keep unpaid invoices.
- SPEC-007: certified <= claimed; subcon-overclaim verified down; backcharge contras negative; subcontract vendors are subcontractor parties.
