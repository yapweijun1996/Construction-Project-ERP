# TASK-005 — Build Contract & Variation Register

Status: done  
Priority: high  
Epic: EPIC-002  
Spec: SPEC-003

## Objective
Build the Contract & Commercial register: main contract summary, commercial
change register and work-package register with explicit DO / progress
measurement evidence, driven by the current project context.

## Acceptance
- [x] Behaviour matches parent SPEC (contract summary, change kinds, WP fields, DO/measurement evidence, revision-impact note).
- [x] Relevant domain/data tests pass (130/130).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- Main contract summary: Original / Approved Changes / Adjusted Contract / status.
- Commercial change register: code, kind (VO/Omission/Adjustment/Revised PO/Backcharge), description, signed value (sign + colour), Approved/Pending status.
- Work-package register: code, WBS, trade, location, fulfilment type, billing basis, explicit 'DO Required' vs 'Progress Measurement' evidence pill, value/claimed/certified/remaining.
- BR-CONTRACT-003 note displayed; adjusted contract = original + approved changes (reconciliation).
- Project context: shared across sections via app-level current project; picker to switch projects.
- Browser QA: 2 register tables, 19 evidence pills, revision note, axe 0 violations, 0 console errors.
