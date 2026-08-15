# DATA MODEL

Core entities:
projects, parties, wbs_nodes, contracts, contract_lines, commercial_changes, progress_measurements, claim_headers/lines, certification_headers/lines, ar_documents/lines, receipts, allocations, purchase_orders, subcontracts, subcontract_claims/certifications, cost_budgets, cost_transactions, poc_snapshots, retentions, documents, audit_events.

Use stable internal IDs and explicit foreign keys; document numbers are references, not primary keys.

Use decimal-safe currency arithmetic.
