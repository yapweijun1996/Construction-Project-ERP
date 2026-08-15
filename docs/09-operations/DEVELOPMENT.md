# DEVELOPMENT

Requirements: Node.js >= 20.

Recommended local commands:
```bash
npm install
npm run dev        # local dev server (Vite)
npm run build      # typecheck + production build (dist/)
npm run test       # Vitest unit/component tests
npm run typecheck  # TypeScript project check
```

GitHub Pages sub-path hosting: `BASE_PATH=/my-repo/ npm run build` overrides the Vite base (default `/Construction-Project-ERP/`).

Keep business calculations in domain/application modules; seed generator deterministic; UI does not duplicate authoritative arithmetic.
