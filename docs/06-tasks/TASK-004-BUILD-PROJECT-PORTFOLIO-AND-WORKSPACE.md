# TASK-004 — Build Project Portfolio & Workspace

Status: done  
Priority: urgent  
Epic: EPIC-001  
Spec: SPEC-002

## Objective
Render the deterministic 30-project baseline as a filterable portfolio and a
per-project workspace with the SPEC-002 KPI set, computed in domain code.

## Acceptance
- [x] Behaviour matches parent SPEC (portfolio columns + 6 filters; workspace KPI set).
- [x] Relevant domain/data tests pass (124/124).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- Portfolio table: code/name/client/type/status/adjusted/work done/certified/AR/margin for all 30 projects.
- Filters: status, year, type, client, scenario, value band — each verified by component tests (e.g. Completed → 8 rows, negative-claim → 1 row).
- Project workspace: 14 KPI cards (Original, Changes, Adjusted, Work Done, Claimed, Certified, Billed, Collected, AR, Budget, Actual, Forecast, POC, Margin) with back navigation.
- KPIs computed in src/domain/kpis.ts (ARCHITECTURE rule); adjusted contract, AR exposure and margin arithmetic unit-tested against the baseline.
- Browser QA: 30-row table on desktop/tablet/mobile, workspace open/back, axe WCAG 0 violations, 0 console errors.
