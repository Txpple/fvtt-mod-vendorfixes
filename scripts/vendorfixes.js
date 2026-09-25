/**
 * Vendor Fixes — stopgap fixes for bugs in upstream packages we depend on (the premium dnd5e
 * books first, and the system and platform under them) until the vendor fixes them, if ever.
 * One file per fix under scripts/patches/, each behind its own world setting, each registering
 * its own hooks, each with a row in REGISTER.md under its VF-NNN id. This is the only esmodules
 * entry; the names the fixes share are in core.js.
 */
import "./core.js";
import "./patches/shim-chains.js";
import "./patches/necrotic-shroud-clock.js";
import "./patches/pass-without-trace-area.js";
