/**
 * VF-002 · NECROTIC SHROUD'S CLOCK — the Aasimar's Necrotic Shroud frightens until the end of the
 * Aasimar's next turn, not for a minute.
 *
 * THE PROBLEM (the Battle Flow Aasimar walk, 2026-09-25 — measured on the sandbox, dnd5e 6.0.5,
 * Foundry 14.368, the PHB's `dnd-players-handbook.origins` Celestial Revelation, phbsptCelestialR):
 * the item carries three effects, one per transformation, and the vendor gave all three the same
 * clock, `duration: { value: 60, units: "seconds", expiry: "turnStart" }` — the transformation's
 * minute. That is right for Heavenly Wings (ImizUNJTv9cWt2bV) and Searing Radiance
 * (Knzg8v7eDNDBW4ud), which sit on the Aasimar while it is transformed. It is wrong for Necrotic
 * Shroud (33dHubd4zYAkSAbE, statuses: frightened), which is not the Aasimar's transformation at all:
 * the save activity (CbkwF9PTlPUvnv7Q) puts it on each enemy that fails the Charisma save, and the
 * rule says that creature "has the Frightened condition until the end of your next turn". The
 * minute was copied across from its siblings. Nothing else in the data holds the right clock
 * either: the activity's own duration is also the transformation's 1 minute. So a frightened
 * creature stays Frightened ten rounds instead of about one.
 *
 * THE FIX: when a COPY of that effect is created on a creature (the damage tray, Battle Flow's
 * saves machine, anything that applies it), its clock is set to the system's own pseudo-expiry
 * `sourceEnd` — "End of Source's Next Turn", judged by dnd5e against the Aasimar's turn and
 * skipping the turn it was applied on (ActiveEffect5e#isExpiryEvent), exactly the rule. dnd5e's
 * own `_preCreate` would clear the value for a pseudo-expiry; the fix clears it too, since the
 * hook may run after it. Only a copy wearing the defect is touched — the frightened status, the
 * name, the pack's minute — so an upstream fix (any other clock) makes this a no-op. The pack's
 * data is never edited.
 */
import { MODULE_ID, TITLE } from "../core.js";

const SETTING_ON = "necroticShroudClock";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_ON, {
    name: "Necrotic Shroud frightens until the end of the Aasimar's next turn",
    hint: "(VF-002) The Player's Handbook's Aasimar Necrotic Shroud leaves a creature Frightened for a whole minute; the rule is until the end of the Aasimar's next turn. On, every Frightened it lands ends at the end of the Aasimar's next turn, as written.",
    scope: "world", config: true, type: Boolean, default: true
  });
});

/**
 * Is this effect data the pack's Necrotic Shroud copy, still wearing the minute? Pure over the
 * plain data, so a suite can test it without a world.
 * @param {{name?: string, statuses?: Iterable<string>, duration?: {value?: number|null, units?: string|null, expiry?: string|null}}} data
 * @returns {boolean}
 */
export function wearsShroudMinute(data) {
  if ( String(data?.name ?? "").trim().toLowerCase() !== "necrotic shroud" ) return false;
  if ( ![...(data?.statuses ?? [])].includes("frightened") ) return false;
  const d = data?.duration ?? {};
  return (Number(d.value) === 60) && (d.units === "seconds") && ((d.expiry ?? "turnStart") === "turnStart");
}

Hooks.on("preCreateActiveEffect", (effect, data) => {
  try {
    if ( !game.settings.get(MODULE_ID, SETTING_ON) ) return;
    if ( !(effect.parent instanceof Actor) ) return;   // the copy on a creature, never the item's own
    const src = effect._source;
    if ( !wearsShroudMinute({ name: src.name, statuses: src.statuses, duration: src.duration }) ) return;
    effect.updateSource({ "duration.expiry": "sourceEnd", "duration.value": null });
  } catch(err) {
    console.error(`${TITLE} | Necrotic Shroud's clock could not be set — it lasts the pack's minute.`, err);
  }
});
