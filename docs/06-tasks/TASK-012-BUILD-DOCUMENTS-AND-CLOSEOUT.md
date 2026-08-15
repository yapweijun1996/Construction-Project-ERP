# TASK-012 — Build Documents & Closeout

Status: done  
Priority: medium  
Epic: EPIC-007  
Spec: SPEC-009

## Objective
Build the Documents register and Closeout views: document categories,
retention release, DLP/defects, final account and lifecycle status.

## Acceptance
- [x] Behaviour matches parent SPEC (document categories, retention status, defect list, final account, closeout notes).
- [x] Relevant domain/data tests pass (171/171).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- Documents: register with doc no/category/title/rev/date, category filter, doc/revision counts.
- Closeout: project status, final claim/cert, retention receivable+payable with release and outstanding amounts, defect list for DLP, final account documents.
- Lifecycle notes: practical completion (Completed), DLP retention pending, final-account dispute flag.
- Browser QA: 71 document rows, retention table, axe 0 violations, 0 console errors.
