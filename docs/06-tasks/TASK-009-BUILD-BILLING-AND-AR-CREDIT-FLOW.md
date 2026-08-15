# TASK-009 — Build Billing & AR Credit Flow

Status: done  
Priority: high  
Epic: EPIC-004  
Spec: SPEC-006

## Objective
Build the Billing & AR view: CCAR → AR document → receipt/credit allocation
→ settlement, with explicit credit notes for negative certification.

## Acceptance
- [x] Behaviour matches parent SPEC (invoice/credit-note documents, receipts, credit allocations, settlement statuses).
- [x] Relevant domain/data tests pass (153/153).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- AR summary: Billed / Credits / Collected / AR Exposure (AR = Billed + Credits − Collected).
- AR document register: doc no, invoice vs credit-note pill, issued date, amount/GST/total, settlement status.
- Invoice detail: receipts and allocations; credit application rows reference the credit note (BR-AR-003).
- Credit-note detail: 'Applied Against' list of invoices/receipts.
- late-ar hero: outstanding Issued invoices visible; BR-AR-001 stages distinct.
- Browser QA: AR register + detail, axe 0 violations, 0 console errors.
