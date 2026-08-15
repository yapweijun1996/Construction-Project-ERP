# Changelog

## [Unreleased]

### Added
- Initial project documentation package.
- Project-first construction domain model.
- Singapore five-year mock dataset blueprint.
- Initial EPIC/SPEC/ADR/TASK backlog.
- TASK-001: Vite + React + TypeScript static PWA scaffold — responsive app shell (desktop/tablet/mobile), WCAG AA design tokens, business status vocabulary, Vitest setup, offline-capable build.
- TASK-002: deterministic seed engine — mulberry32 PRNG with derived per-stage streams, fail-closed seed-config validation, domain entity types, catalog materialisation (102 parties, 30 projects) and canonical baseline serialisation.
- TASK-003 (Part 1): commercial scope generation — 30 main contracts, work packages (SPEC-001 target band) with exact value reconciliation, and commercial changes (VO/Omission/Adjustment/Revised PO/Backcharge) honouring ADR-003 DO rules.
- TASK-003 (Part 2): progress measurements, PCAR and CCAR generation — Current Claim ≠ Cumulative Entitlement arithmetic, cumulative certification with negative-certification write-downs (ADR-008), retention/advance-recovery explicit fields, certification gaps, GST 7/8/9 by claim year.
- TASK-003 (Part 3): AR, receipts/allocations, procurement and subcontract generation — CCAR→AR→receipt→credit-allocation→settlement chain, explicit AR credit application (BR-AR-003), late-ar hero, PO/subcontract orders, subcon claims with overclaim verification and backcharge contras.
- TASK-003 (Part 4): cost transactions (10k+), POC snapshots (plan/actual, 5 distinct progress measures + forecast final cost), retention register, document register (SPEC-009 categories) and 3k+ audit events — full SPEC-001 target reconciliation green.

### Fixed
- Mock catalogs now use stable internal IDs (`c-*`/`p-*`) with explicit `clientId` foreign keys (P3).
- Hero scenario tags aligned with SPEC-001: `physical-material-with-do` + `progress-work-no-do` now present in catalog (P4).
- `seed-config.example.json` gains a numeric `seed`; DEMO-DATA-ENGINE defines the deterministic PRNG contract (P1).
- DOCUMENTATION-MANIFEST fileCount corrected; EPIC-001 status aligned to Phase 0; GLOSSARY PCAR/CCAR clarified.
- EPIC files now list their TASKs; SPEC files declare Parent Epic and Related ADRs (traceability back-links).
- New `mock-data/vendors.catalog.json` provides 84 fictional suppliers/subcontractors (50 suppliers, 34 subcontractors).

## [0.0.1-docs] - 2026-08-15
- Project name established as **Construction Project ERP**.
