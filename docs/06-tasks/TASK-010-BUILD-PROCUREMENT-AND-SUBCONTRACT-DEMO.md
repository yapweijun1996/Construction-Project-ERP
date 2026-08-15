# TASK-010 — Build Procurement & Subcontract Demo

Status: done  
Priority: medium  
Epic: EPIC-005  
Spec: SPEC-007

## Objective
Build the procurement and subcontract demo: purchase orders / subcontract
awards and the subcontract claim chain (Award → Subcon Claim → QS Verification
→ Subcon Certificate → AP/Payment).

## Acceptance
- [x] Behaviour matches parent SPEC (order register, subcontract awards, claimed vs certified with verification, holds and backcharge contras).
- [x] Relevant domain/data tests pass (159/159).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- Procurement: order register with PO vs Subcontract Award pills, vendor names from party register, committed summary, SPEC-007 chain note.
- Subcontracts: awards with retention and values; claim chain per subcontract (claimed vs certified vs difference).
- subcon-overclaim hero: verified-down claims flagged; backcharge contra negative certifications; on-hold claims.
- Browser QA: subcontract claims table renders, axe 0 violations, 0 console errors.
