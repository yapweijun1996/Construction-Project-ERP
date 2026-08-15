# TASK-015 — Public Demo QA & GitHub Pages Release

Status: done  
Priority: medium  
Epic: EPIC-001  
Spec: SPEC-010

## Objective
Public demo QA and GitHub Pages release: security checklist, release-level
browser QA (offline warm load, three viewports), CI/CD workflow and push.

## Acceptance
- [x] Behaviour matches parent SPEC (installable/offline PWA verified against the production build).
- [x] Relevant domain/data tests pass (191/191).
- [x] UI task includes browser/mobile evidence when applicable (scripts/qa-release.mjs).
- [x] No real customer data (static scan: no secrets, no private URLs, no real entities).
- [x] Documentation updated if behaviour changed (CHANGELOG, PROJECT-STATUS, GITHUB-PAGES).

## Evidence
- Security: no secrets/private URLs/innerHTML in src; npm audit 0 vulnerabilities.
- Release QA on `vite preview` build: service worker registered+active, manifest valid (3 icons), offline warm-load reload renders the app, 0 failed requests, 0 page errors, axe 0 violations, no horizontal overflow at desktop/tablet/mobile.
- CI/CD: .github/workflows/deploy.yml (typecheck → test → build → GitHub Pages on every push to main).
- GITHUB-PAGES.md updated with the actual repository URL shape.
- Deployment push: see commit history (repository remote).
