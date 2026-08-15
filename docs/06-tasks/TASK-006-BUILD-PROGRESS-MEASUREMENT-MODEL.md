# TASK-006 — Build Progress Measurement Model

Status: done  
Priority: high  
Epic: EPIC-003  
Spec: SPEC-004

## Objective
Build the progress measurement model view: monthly plan/actual measurements
with progress bars and the latest work-package progress from claim lines.

## Acceptance
- [x] Behaviour matches parent SPEC (plan/actual measurement view; WP progress lines with evidence).
- [x] Relevant domain/data tests pass (135/135).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- KPI cards: Latest Actual, Latest Plan, Monthly Movement (sign-aware), Latest Measurement date.
- Monthly measurement table: period, plan/actual kind, measured date, cumulative % and accessible progress bars.
- Latest work-package progress: code, trade, DO/measurement evidence, current %, value and current amount.
- Browser QA: 10 progress bars, 2 tables, axe 0 violations, 0 console errors.
