# PROJECT STATUS

Updated: 2026-08-15

Current phase: **Phase 1 — Project Portfolio & Workspace** (TASK-001 done)

## Established
- Name: Construction Project ERP
- Project-first domain direction
- 30-project / 5-year Singapore dataset requirement
- Static local-first PWA direction
- Initial epics/specs/tasks/ADRs
- Vite + React + TypeScript PWA scaffold (TASK-001): responsive app shell (desktop/tablet/mobile), WCAG AA design tokens, business status vocabulary, Vitest suite, offline-capable build
- Deterministic seed engine (TASK-002): mulberry32 PRNG streams, fail-closed config/catalog validation, baseline materialisation (102 parties, 30 projects) with byte-for-byte reproducibility
- Full deterministic transaction baseline (TASK-003): contracts/WP/commercial changes, progress/PCAR/CCAR, AR/receipts/allocations, procurement/subcontract claims, cost/POC, retentions, documents and audit — every SPEC-001 target band verified (109/109 tests)
- Portfolio & workspace UI (TASK-004): filterable 30-project table and per-project workspace with 14 domain-computed KPIs (124/124 tests, axe-clean)

## Next
1. TASK-005 Contract & variation register
2. TASK-014 Demo data integrity test suite
3. TASK-006 Progress measurement model
