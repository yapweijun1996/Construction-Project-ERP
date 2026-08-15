# TASK-002 — Implement Deterministic Seed Engine

Status: done  
Priority: urgent  
Epic: EPIC-001  
Spec: SPEC-001

## Objective
Land the deterministic generation infrastructure: fixed 32-bit PRNG with per-stage
derived streams, fail-closed seed-config parsing, domain entity types, catalog
materialisation (parties/projects) and canonical baseline serialisation.

## Acceptance
- [x] Behaviour matches parent SPEC (deterministic baseline per SPEC-001 / ADR-006).
- [x] Relevant domain/data tests pass (38/38 Vitest).
- [x] UI task includes browser/mobile evidence when applicable (N/A — no UI surface).
- [x] No real customer data.
- [x] Documentation updated (DEMO-DATA-ENGINE, mock-data/README, CHANGELOG).

## Evidence
- Byte-for-byte reproducibility: serializeBaseline(generateBaseline(...)) identical across runs.
- Different seed produces a different serialized baseline.
- Fail-closed validation throws on: missing/invalid seed, deterministic=false, duplicate ids, dangling clientId, project-count drift from targets.
- Materialised baseline: 102 parties (18 clients / 50 suppliers / 34 subcontractors), 30 projects with resolvable clientId FKs, stable metadata (engineVersion/seedVersion/seed).
- `npm run typecheck` clean; `npm run build` clean; Vitest 38/38.
