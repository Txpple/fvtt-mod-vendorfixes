# Vendor Fixes

Stopgap fixes for bugs in the content and packages we depend on (the premium dnd5e books
first: the PHB, DMG, MM and others, then the system and platform under them), held until the
vendor ships its own fix, if ever. Each fix is one file, behind its own setting in
**Game Settings → Configure Settings → Vendor Fixes**. A fix is retired once the vendor fixes the
bug upstream.

Every fix is listed in the [register](REGISTER.md): one table row per fix, giving the vendor,
the book or package, the documents, the bug, the fix, and the modules that rely on it.

Requires dnd5e 5.x or 6.x on Foundry v13 or v14. Replaces
[Misc Patches](https://github.com/Txpple/fvtt-mod-miscpatches), whose one live patch moved here
as VF-001.

## Fixes

One row per fix, the same columns for each. The full record (documents, versions measured,
dependents, when to retire) is the [register](REGISTER.md); the full write-up is the comment at
the top of each fix file.

<!-- fixes:start -->
| ID | Fix | Status | Book / package | What is wrong | What the fix does | Switch (default) | Release |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VF-001 | Old effect keys reach their new fields | active | dnd5e system; seen in the PHB | dnd5e 6.0 redirects effects written for moved fields, but only one step, and some fields moved twice. The PHB Ranger's Roving landed on a field that is no longer a number: a 35-foot speed read 3510, and Half Speed never halved. | When the world loads, every redirect is pointed at the field's final home. Fields that moved once are untouched. | *Old effect keys reach their new fields* (on; takes effect on reload) | v1.0.0 |
| VF-002 | Necrotic Shroud frightens until the end of the Aasimar's next turn | active | PHB, Character Origins (Aasimar, Celestial Revelation) | All three transformation effects carry the transformation's 1-minute clock. That fits Heavenly Wings and Searing Radiance, which sit on the Aasimar, but Necrotic Shroud is the Frightened put on each enemy that fails the save, and it should end at the end of the Aasimar's next turn. The save's own duration is a minute too, so the book holds no right clock and the creature stays Frightened ten rounds. | When the effect lands on a creature, it is set to end at the end of the Aasimar's next turn. Only a copy still carrying the book's minute is touched. | *Necrotic Shroud frightens until the end of the Aasimar's next turn* (on) | v1.1.0 |
| VF-003 | Pass without Trace radiates its 30-foot Emanation | active | PHB, Spells | The spell is a 30-foot aura giving +10 Stealth, but it has no area at all (range Self, empty area), so nothing can tell who stands in the aura and the book's +10 effect only lands by hand. | When the spell loads, one with no area is given its 30-foot Emanation, in memory. A spell that already has an area is left alone. | *Pass without Trace radiates its 30-foot Emanation* (on; takes effect on reload) | v1.1.0 |
<!-- fixes:end -->

None of the fixes edits a compendium or saves anything to a sheet; they correct the data as it
loads, so every copy is fixed, including items already on actors.

## Testing

- `node tools/check-register.mjs` checks that the register parses and agrees with the code
  and with the table above (offline). Add `--json` to print it as JSON.
- `node tools/smoke-shim-chains.mjs` builds rangers in memory (nothing is written) with an
  old-key speed bonus and with the PHB's own Roving, and checks the speeds come out as the rule
  says. It needs the house MCP repo beside this one for its Foundry client.
