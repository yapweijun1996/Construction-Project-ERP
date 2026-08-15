# TASK-003 — Generate 30-Project Portfolio

Status: in progress  
Priority: urgent  
Epic: EPIC-001  
Spec: SPEC-001

## Objective
Generate the full 30-project deterministic transaction baseline from the seed
engine, hitting the SPEC-001 transaction targets. Delivered in stages:
1. Contracts / work packages / commercial changes (done — Part 1).
2. Progress measurements + PCAR/CCAR.
3. AR / receipts / allocations + procurement / subcontracts.
4. Cost / POC / documents / audit + full target reconciliation.

## Acceptance
- [ ] Behaviour matches parent SPEC (all transaction targets in SPEC-001).
- [x] Relevant domain/data tests pass (53/53).
- [x] UI task includes browser/mobile evidence when applicable (N/A — data task).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG).

## Evidence (Part 1)
- 30 main contracts; work-package lines and commercial changes within SPEC-001 targets.
- Work-package values sum exactly to contract value per project (reconciliation-safe).
- Adjusted contract = original + signed changes; Omission/Backcharge negative, VO positive.
- ADR-003 respected: doRequired exactly for physical-material; DO-required packages in physical-material-with-do projects; none in progress-work-no-do projects.
- Deterministic byte-for-byte; Vitest 53/53; typecheck and build clean.
