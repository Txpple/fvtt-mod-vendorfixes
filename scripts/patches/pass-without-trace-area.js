/**
 * VF-003 · PASS WITHOUT TRACE'S AREA — the spell radiates a 30-foot Emanation, and the book's
 * spell carries no area at all.
 *
 * THE PROBLEM (the Battle Flow Elf walk, 2026-09-25 — measured on the sandbox, dnd5e 6.0.5,
 * Foundry 14.368, the PHB's `dnd-players-handbook.spells` Pass without Trace, identifier
 * `pass-without-trace`): the rule says "You radiate a concealing aura in a 30-foot Emanation for
 * the duration. While in the aura, you and each creature you choose have a +10 bonus to Dexterity
 * (Stealth) checks". The pack ships the bonus (the "Concealed" effect, +10 to
 * `system.skills.ste.bonuses.check`) but the spell's target has range Self and an EMPTY template —
 * no type, no size — and its one activity inherits the spell's target, so nothing places or
 * reads an area: no aura module can find who stands in it, and the effect only lands by hand.
 *
 * THE FIX: when a spell's data is prepared (SpellData#prepareBaseData, wrapped at `init`), a Pass
 * without Trace whose template has no type is given the rule's own area — a `radius` template
 * (dnd5e's Emanation) of 30 feet — in memory. The activity inherits it as it inherits every other
 * part of the spell's target, so the book's copy, the world's and every copy on a sheet read the
 * area. Nothing is saved; the pack is never edited. A template that already has a type is left
 * alone, so an upstream fix makes this a no-op.
 */
import { MODULE_ID, TITLE } from "../core.js";

const SETTING_ON = "passWithoutTraceArea";

/** The area the rule gives the spell: a 30-foot Emanation. */
export const PWT_AREA = Object.freeze({ type: "radius", size: "30", units: "ft" });

/**
 * Is this spell data Pass without Trace still missing its area? Pure over the plain data, so a
 * suite can test it without a world.
 * @param {{identifier?: string, target?: {template?: {type?: string|null}}}} system
 * @returns {boolean}
 */
export function lacksPwtArea(system) {
  if ( String(system?.identifier ?? "").toLowerCase() !== "pass-without-trace" ) return false;
  return !system?.target?.template?.type;
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_ON, {
    name: "Pass without Trace radiates its 30-foot Emanation",
    hint: "(VF-003) The Player's Handbook's Pass without Trace has no area on the spell, so nothing can tell who stands in its aura and the +10 to Stealth only lands by hand. On, the spell carries its 30-foot Emanation, as written. Takes effect on reload.",
    scope: "world", config: true, type: Boolean, default: true, requiresReload: true
  });
  try {
    const SpellData = CONFIG.Item.dataModels?.spell;
    if ( !SpellData?.prototype?.prepareBaseData ) throw new Error("dnd5e's spell data model not found");
    const original = SpellData.prototype.prepareBaseData;
    SpellData.prototype.prepareBaseData = function(...args) {
      const result = original.apply(this, args);
      try {
        if ( game.settings.get(MODULE_ID, SETTING_ON) && lacksPwtArea(this) ) Object.assign(this.target.template, PWT_AREA);
      } catch(err) { /* the setting is registered above; a world still loading reads the default */ }
      return result;
    };
  } catch(err) {
    console.error(`${TITLE} | Pass without Trace's area could not be patched — place its area by hand.`, err);
  }
});
