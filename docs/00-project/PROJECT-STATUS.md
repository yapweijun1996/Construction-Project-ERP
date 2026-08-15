# PROJECT STATUS

Updated: 2026-08-15

Current phase: **Phase 1 — Project Portfolio & Workspace** (all TASKs done)

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
- CCAR certification (TASK-008): submitted vs certified with holds, remarks and negative-certification AR credit intent (147/147 tests)
- Billing & AR credit flow (TASK-009): invoices, credit notes, receipts and allocations with settlement statuses (153/153 tests)
- Procurement & subcontract demo (TASK-010): PO/award register and subcontract claim chain with verification (159/159 tests)
- Cost & POC dashboard (TASK-011): cost position cards, five distinct progress measures and POC trend (165/165 tests)
- Documents & closeout (TASK-012): document register, retention release, defects and final account views (171/171 tests)
- PWA offline & update UX (TASK-013): user-controlled SW updates, offline banner, seed-aware demo reset (181/181 tests)
- Demo data integrity suite (TASK-014): 40+ programmatic checks with breakage-injection tests and Settings runner (191/191 tests)
- Public demo QA & release (TASK-015): security scan, npm audit, offline warm-load verified on production build, GitHub Pages workflow deployed (191/191 tests)

## Next
- Phase 2 (contract VO/adjustment interactions) — see ROADMAP.md
- Optional cloud/API/MCP/AI expansion (Phase 10)
