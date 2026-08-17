# TASK-016 — Local Edit Layer for Commercial Changes

Status: done
Priority: high
Epic: EPIC-002
Spec: SPEC-003

## Objective
Land the local-edit layer that lets the demo accept user-registered commercial
changes on top of the immutable deterministic baseline (BR-CONTRACT-003:
history is never overwritten — user edits are appended entries).

## Acceptance
- [x] Local edits persist in the app's own namespace (demo:edits) and survive reload.
- [x] applyEdits merges user changes into the baseline without mutating it.
- [x] Invalid drafts are rejected fail-closed (kind/value/description).
- [x] Reset clears edits and restores the byte-identical seed baseline.
- [x] Relevant tests pass (9 edit-layer tests; full suite 207/207).
