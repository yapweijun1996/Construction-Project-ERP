# AGENTS.md — AI Development Contract

## Before Coding

Read README, PROJECT-STATUS, DOMAIN-MODEL, BUSINESS-RULES, parent EPIC, parent SPEC, then TASK.

## Rules

- Do not invent ERP business rules.
- Do not require DO for progress-based construction work.
- Do not merge Claimed, Certified, Billed and Collected.
- Do not treat Current Claim as Cumulative Claim.
- Do not silently modify certified/billed history; create adjustment history.
- Do not change accepted decisions without ADR.
- Do not mark tasks complete without evidence.
- Do not use real customer data.
- Preserve deterministic seed and PWA offline behaviour.
- Keep iOS safe-area, mobile usability and accessibility first-class.

## Conflict Priority

Accepted ADR → Business Rule → Approved SPEC → EPIC → TASK → existing implementation.

## Completion Contract

Task completion requires implementation, acceptance checks, test/browser evidence, and docs/changelog update when behaviour changes.
