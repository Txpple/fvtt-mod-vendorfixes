# Vendor Fix Register

Every fix this module ships for a bug in upstream vendor content, one row per fix. Rows are never
deleted; a retired fix stays with status `retired`. The rules are in
[CLAUDE.md](CLAUDE.md#the-register-registermd). Check with `node tools/check-register.mjs`.

<!-- register:start -->
| ID | Status | Vendor | Package | Source | Documents | Bug | Fix | File | Setting | Measured on | Dependents | Upstream report | Retire when | Added | Retired |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VF-001 | active | Foundry Gaming (dnd5e system) | dnd5e | dnd5e system: ActiveEffect5e.SHIM_FIELDS; exposed by PHB (dnd-players-handbook) | Compendium.dnd-players-handbook.classes.Item.phbrgrRoving0000 (Roving); PHB Spirit Guardians, Half Speed effect | The moved-key table redirects an old effect key one hop only; movement.speed goes to movement.walk, which is no longer a number, so Roving made a 35 ft speed read 3510 and Half Speed never halves | At setup, point every shim entry at the end of its chain; single hops and cycles untouched; pack data never edited | scripts/patches/shim-chains.js | shimChains (world, default on, requires reload) | dnd5e 6.0.3 (2026-09-23); dnd5e 6.0.5 + Foundry 14.368 (2026-09-25, smoke-shim-chains 6/6 as Vendor Fixes alone) | fvtt-mod-battleflow: Spirit Guardians Half Speed on NPCs (BACKLOG, NOTES §2) | not reported | dnd5e resolves SHIM_FIELDS chains itself, or the PHB stops using system.attributes.movement.speed; the fix then finds no chains and does nothing | 2026-09-22 in fvtt-mod-miscpatches v1.1.0; ported here in v1.0.0 (2026-09-25) | — |
<!-- register:end -->
