# Changelog

## [Unreleased]

### Added
- Initial project documentation package.
- Project-first construction domain model.
- Singapore five-year mock dataset blueprint.
- Initial EPIC/SPEC/ADR/TASK backlog.
- TASK-001: Vite + React + TypeScript static PWA scaffold — responsive app shell (desktop/tablet/mobile), WCAG AA design tokens, business status vocabulary, Vitest setup, offline-capable build.

### Fixed
- Mock catalogs now use stable internal IDs (`c-*`/`p-*`) with explicit `clientId` foreign keys (P3).
- Hero scenario tags aligned with SPEC-001: `physical-material-with-do` + `progress-work-no-do` now present in catalog (P4).
- `seed-config.example.json` gains a numeric `seed`; DEMO-DATA-ENGINE defines the deterministic PRNG contract (P1).
- DOCUMENTATION-MANIFEST fileCount corrected; EPIC-001 status aligned to Phase 0; GLOSSARY PCAR/CCAR clarified.
- EPIC files now list their TASKs; SPEC files declare Parent Epic and Related ADRs (traceability back-links).
- New `mock-data/vendors.catalog.json` provides 84 fictional suppliers/subcontractors (50 suppliers, 34 subcontractors).

## [0.0.1-docs] - 2026-08-15
- Project name established as **Construction Project ERP**.
