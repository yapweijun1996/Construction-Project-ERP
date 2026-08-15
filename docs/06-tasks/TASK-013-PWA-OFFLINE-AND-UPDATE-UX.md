# TASK-013 — PWA Offline & Update UX

Status: done  
Priority: medium  
Epic: EPIC-001  
Spec: SPEC-010

## Objective
PWA offline/update UX: user-controlled service-worker updates, offline
awareness, and a demo-data reset panel with seed version and warning.

## Acceptance
- [x] Behaviour matches parent SPEC (user-controlled update, offline banner, reset with seed version + warning).
- [x] Relevant domain/data tests pass (181/181).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data.
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS).

## Evidence
- SW registration switched to 'prompt' with injectRegister null; UpdatePrompt renders on needRefresh with user-controlled Reload (never auto-reloads).
- OfflineIndicator banner on navigator offline; iOS safe-area CSS retained.
- Settings dialog: seed version/seed/engine version/project count; two-step Reset Demo Data with warning; reset clears only demo:* local keys and recreates the byte-identical baseline (verified in tests).
- Browser QA: settings dialog, seed version, reset warning alert, axe 0 violations, 0 console errors.
- Known limitation: PNG touch icons deferred to TASK-015; offline warm-load verification belongs to the GitHub Pages deployment QA.
