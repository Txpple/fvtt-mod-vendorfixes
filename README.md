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

### VF-001 — Old effect keys reach their new fields

**The problem.** dnd5e 6.0 moved many actor fields. It keeps a table that redirects an effect
written against an old key to the new one, so content not yet updated for 6.0 keeps working.
But it redirects only **one step**, and some keys moved twice: `movement.speed` goes to
`movement.walk`, which itself moved to `movement.speeds.walk`. The PHB's Ranger feature Roving
(+10 feet, climb and swim equal to your speed) landed on a field that is no longer a number, and
a 35-foot speed read **3510**.

**The fix.** When the world loads, every redirect whose target was itself redirected is pointed
at the end of its chain. Nothing in any compendium or on any sheet is edited. A key that moved
once is untouched. Switch: *Old effect keys reach their new fields* (on by default; takes effect
on reload).

### VF-002 — Necrotic Shroud frightens until the end of the Aasimar's next turn

**The problem.** The PHB's Aasimar can transform with Necrotic Shroud: creatures that fail the
Charisma save are Frightened "until the end of your next turn". The book's effect lasts a whole
**minute** (the transformation's length), so the creature stays Frightened ten rounds.

**The fix.** When a copy of that effect is put on a creature, its clock is set to dnd5e's own
*End of Source's Next Turn*, which ends it at the end of the Aasimar's next turn. Only a copy still
wearing the book's minute is touched; the compendium is never edited. Switch: *Necrotic Shroud
frightens until the end of the Aasimar's next turn* (on by default).

## Testing

- `node tools/check-register.mjs` checks that the register parses and agrees with the code
  (offline). Add `--json` to print it as JSON.
- `node tools/smoke-shim-chains.mjs` builds rangers in memory (nothing is written) with an
  old-key speed bonus and with the PHB's own Roving, and checks the speeds come out as the rule
  says. It needs the house MCP repo beside this one for its Foundry client.
