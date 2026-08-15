# Construction Project ERP

**Interactive static PWA demo for project-based construction ERP workflows.**

Status: App scaffold live (TASK-001 done)  
Updated: 2026-08-15

## Product Idea

Construction Project ERP is **project-first**, not Sales-Order-first:

**Project → Contract → Work Package → Variation → Progress → Claim → Certification → Billing → Cash → Cost/POC → Closeout**

The public GitHub demo should open with useful history immediately—no setup wizard and no empty dashboard.

## Demo Dataset

Baseline v1 must include:

- 30 fictional Singapore projects
- 2022–2026 history
- 15+ fictional clients
- 80+ fictional suppliers/subcontractors
- Contract, VO, claim, certification, billing, AR, procurement, subcon and cost history
- Healthy and exception scenarios
- Deterministic one-click reset

See `docs/05-specs/SPEC-001-SINGAPORE-DEMO-DATASET.md`.

## Develop

Requires Node >= 20. `npm install`, `npm run dev`, `npm run build`, `npm run test`. See `docs/09-operations/DEVELOPMENT.md`.

## Recommended Demo Stack

- React + TypeScript + Vite
- Static GitHub Pages deployment
- PGlite or equivalent browser-local relational engine
- IndexedDB persistence
- Service Worker / installable PWA
- No mandatory backend

## Read Order

1. `START-HERE-AI-AGENT.md`
2. `AGENTS.md`
3. `docs/00-project/PROJECT-STATUS.md`
4. `docs/01-product/DOMAIN-MODEL.md`
5. `docs/01-product/BUSINESS-RULES.md`
6. Relevant EPIC
7. Relevant SPEC
8. Assigned TASK

## Documentation Chain

```text
VISION → ROADMAP → EPIC → SPEC → BUSINESS RULE / ADR → TASK → CODE → TEST → CHANGELOG
```

All public-demo business data is synthetic.
