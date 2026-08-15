# TASK-014 — Demo Data Integrity Test Suite

Status: done  
Priority: medium  
Epic: EPIC-001  
Spec: SPEC-001

## Objective
Land the demo data integrity suite: programmatic checks for unique ids,
foreign keys, reconciliations, the claim/cert/billing chain, allocation
limits, cost/POC totals, hero scenarios and retention consistency, exposed
in Settings.

## Acceptance
- [x] Behaviour matches parent SPEC (MOCK-DATA-VALIDATION.md checklist implemented).
- [x] Relevant domain/data tests pass (191/191).
- [x] UI task includes browser/mobile evidence when applicable (Settings integrity runner).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- src/domain/integrity.ts: 40+ checks (unique ids ×20, foreign keys ×21, adjusted-contract, current-vs-cumulative, line movements, AR=cert increment, invoice/credit signs, allocation limits, cost/POC totals, hero scenarios, retention consistency).
- Breakage-injection tests prove each check catches real corruption (duplicates, dangling FKs, broken arithmetic, positive credits, over-collection, missing hero, retention drift).
- Settings dialog exposes 'Run Integrity Checks' with a green report (0 failed).
- Full suite 191/191; axe 0 violations; build clean.
