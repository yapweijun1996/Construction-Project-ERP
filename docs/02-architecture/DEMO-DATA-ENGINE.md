# DEMO DATA ENGINE

Generate business history from deterministic project stories:

seed-config → parties → project stories → contracts/work packages → monthly progress → PCAR/CCAR → AR/cash → procurement/subcon → cost/POC → documents/audit.

Use seed version `SG-DEMO-2026.1`.

Deterministic PRNG: the generator seeds a fixed 32-bit PRNG (e.g. mulberry32) with the numeric `seed` from seed-config. Identical `seed` + `seedVersion` + catalog files must reproduce the identical baseline; changing any of them is a baseline version change.

Reset discards only this demo's local edits and recreates the same baseline records.
