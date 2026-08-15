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
- Contract & variation register (TASK-005): main contract summary, commercial changes and work packages with explicit DO/measurement evidence (130/130 tests)
- Progress measurement model (TASK-006): monthly plan/actual measurements with progress bars and latest WP progress (135/135 tests)
- PCAR wizard (TASK-007): five-step claim review with SPEC-004 summary and negative-claim highlighting (141/141 tests)

## Next
1. TASK-008 CCAR certification
2. TASK-009 Billing & AR credit flow
3. TASK-014 Demo data integrity test suite
