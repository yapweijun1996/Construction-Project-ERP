# TASK-001 — Scaffold Static PWA

Status: done  
Priority: urgent  
Epic: EPIC-001  
Spec: SPEC-010

## Objective
Scaffold the Vite + React + TypeScript static PWA with a responsive app shell,
design-system baseline, test setup and offline-capable production build.

## Acceptance
- [x] Behaviour matches parent SPEC (installable manifest, offline precache, iOS safe-area CSS).
- [x] Relevant domain/data tests pass (Vitest 8/8).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-visual.mjs).
- [x] No real customer data (placeholder UI only).
- [x] Documentation updated if behaviour changed (README, PROJECT-STATUS, DEVELOPMENT, CHANGELOG).

## Evidence
- `npm run build`: clean; PWA assets generated (manifest.webmanifest, sw.js, 13 precache entries, ~207 KB).
- `npm run typecheck` (`tsc -b`): clean.
- `npm test`: 8/8 pass — shell rendering, hash navigation, business status vocabulary, skip link, bottom-nav More sheet flow.
- Browser QA via `scripts/qa-visual.mjs` (playwright-core + axe-core):
  - desktop 1440×900: 11 nav links, 10 status pills, skip link, 0 console/page errors
  - tablet 768×1024: menu toggle visible, drawer opens
  - mobile 390×844: bottom nav visible, More sheet opens/closes
  - axe (WCAG 2A/AA/21AA): 0 violations
- Screenshots/axe report kept in spike/qa/ (git-ignored).
