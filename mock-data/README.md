# Mock Data

Synthetic public-demo inputs only. `projects.catalog.json` contains the 30 project stories; generators should derive the detailed transaction history deterministically.

Catalog conventions:
- `clients.catalog.json`: one record per client; `id` (`c-*`) is the stable internal key.
- `vendors.catalog.json`: 84 fictional suppliers (`type: supplier`) and subcontractors (`type: subcontractor`); `id` (`v-*`) is the stable internal key.
- `projects.catalog.json`: `id` (`p-*`) is the stable internal key; `clientId` is an explicit foreign key into the client catalog; `projectCode` is a display/document reference only.
- `scenarios` tags must cover the twelve hero scenarios defined in SPEC-001; additional tags only add story flavour.
- `seed-config.json` is the active baseline config (numeric `seed` 20260815 + `seedVersion` SG-DEMO-2026.1); `seed-config.example.json` documents the same shape as a template.
