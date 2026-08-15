# TASK-011 — Build Cost & POC Dashboard

Status: done  
Priority: medium  
Epic: EPIC-006  
Spec: SPEC-008

## Objective
Build the Cost & POC dashboard: budget/committed/actual/forecast position,
five distinct progress measures and the POC trend.

## Acceptance
- [x] Behaviour matches parent SPEC (all SPEC-008 cost fields; physical/claim/cert/POC/collection as distinct measures).
- [x] Relevant domain/data tests pass (165/165).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- 12 cost-position cards: Original/Revised Budget, Committed, Actual, Forecast, Cost To Complete, Variance, Recognised Revenue, Gross Profit, Margin, POC, transaction count.
- Five distinct progress measures with BR-COST-001 note; cost by category; POC trend table.
- Forecast overrun flagged on cost-overrun hero projects; committed reconciles to purchase orders.
- Browser QA: 12 cost cards, 5 measure cards, POC trend rows, axe 0 violations, 0 console errors.
