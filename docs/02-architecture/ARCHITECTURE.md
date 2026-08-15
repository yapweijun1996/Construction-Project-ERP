# ARCHITECTURE

Status: Accepted for Demo v1

```text
GitHub Pages
  ↓
Vite Static PWA
  ↓
React + TypeScript
  ↓
Application / Domain Services
  ↓
Browser-local relational DB (PGlite recommended)
  ↓
IndexedDB persistence
  ↓
Deterministic Seed Generator
```

No baseline feature requires a private backend.

Suggested modules: `app/`, `domain/`, `features/`, `data/`, `pwa/`, `ui/`.

Business calculations live in domain/application code, not duplicated across components.
