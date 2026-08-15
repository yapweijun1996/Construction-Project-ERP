# TASK-007 — Build PCAR Wizard

Status: done  
Priority: high  
Epic: EPIC-003  
Spec: SPEC-004

## Objective
Build the PCAR wizard presentation: Prelim → Work Done → Adjustments → Review
→ Submit, with SPEC-004 summary fields and negative-claim highlighting.

## Acceptance
- [x] Behaviour matches parent SPEC (5-step flow, work lines with prior/current %/amounts and movement, summary fields, negative claim highlighted).
- [x] Relevant domain/data tests pass (141/141).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- PCAR register with per-claim links; negative claims marked with minus sign and row highlight.
- Wizard: Prelim (project/period/GST/retention), Work Done (per-WP prior/current %, amounts, movement), Adjustments (retention, advance recovery, previous certified — BR-CLAIM-005), Review (Current Cumulative Entitlement / Previous Certified / This Claim ex GST / GST / Total), Submit (status, read-only demo note).
- Negative-claim hero: review summary flagged with AR credit intent note (BR-CLAIM-006).
- Step navigation with aria-current and Previous/Next controls; returns to register.
- Browser QA: 5 wizard steps, 5 review summary fields, axe 0 violations, 0 console errors.
