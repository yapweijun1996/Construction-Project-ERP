# TASK-008 — Build CCAR Certification

Status: done  
Priority: high  
Epic: EPIC-004  
Spec: SPEC-005

## Objective
Build the CCAR certification view: submitted vs certified comparison without
changing the original PCAR, covering full/partial/zero/negative certification,
holds, remarks and the finance billing-queue hand-off.

## Acceptance
- [x] Behaviour matches parent SPEC (comparison view, hold/remarks, negative certification, finance queue note).
- [x] Relevant domain/data tests pass (147/147).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- CCAR register: cert no, period, status pill, certified cumulative, this-cert increment (sign-aware), on hold.
- Detail view: Submitted (This Claim ex GST) vs Certified This Period vs Certified Cumulative vs On Hold vs Status.
- Negative certification flagged with AR credit intent note (ADR-008 / BR-AR-003).
- Hold remarks rendered as accessible notes; finance queue hand-off note to Billing & AR.
- Browser QA: CCAR register, 5-card comparison, axe 0 violations, 0 console errors.
