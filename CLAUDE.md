# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Vendor Fixes** (`fvtt-mod-vendorfixes`) is a house Foundry VTT module of stopgap fixes for bugs
in upstream packages we depend on. Most are in the premium dnd5e compendium books (PHB, DMG, MM,
and others), which are unlikely to be fixed any time soon. The dnd5e system and the platform
under the books count as upstream too. Each fix stays only until the vendor ships a real fix,
which may never happen. When upstream fixes the bug, the fix is retired.

**Replaces Misc Patches** (`../fvtt-mod-miscpatches`, user call 2026-09-25). Its only live
patch, shim chains, moved here unchanged as **VF-001** (module id and setting namespace are
now `fvtt-mod-vendorfixes`). Misc Patches is being retired; see
[Retiring Misc Patches](#retiring-misc-patches) below. Do not add new work there.

### Where a fix belongs

- **Here:** a bug in something we did not write and cannot fix at the source. That means a
  premium book's data (a broken effect key, a bad activity, a wrong formula, a bad item or
  monster), the dnd5e system, Foundry itself, or a third-party module.
- **`../fvtt-mod-battleflow`:** rules of the game. Never put rules here. The user does not want
  a vendor fix used as a crutch for a house module's own gaps (2026-09-24, about Misc Patches:
  *"I don't want to use Misc Patches as a crutch"*).

## Commands

There is no build, bundler, linter or unit-test runner. The module is plain ES modules loaded
straight from `scripts/`.

- `node tools/check-register.mjs`: checks that the register parses and agrees with the code
  (offline, no dependencies). Add `--json` to print the register as JSON. Run it before every
  commit. `npm run check` runs the same thing.
- `node tools/<suite>.mjs`: runs one live suite against the local sandbox (see below). For
  example, `node tools/smoke-shim-chains.mjs` tests VF-001.
- `powershell -ExecutionPolicy Bypass -File tools/build-release.ps1`: builds the release zip in
  `dist/`.

## Layout and conventions (shared with the sister modules)

- `module.json` has a single `esmodules` entry, `scripts/vendorfixes.js`. It only imports
  `core.js` (`MODULE_ID`, `TITLE`, nothing else) and one file per fix under `scripts/patches/`.
  Each fix file registers its own world setting in `init` and its own hooks. The fixes share
  nothing but the settings menu. Adding a fix file means editing `module.json`'s description,
  and the sandbox must be restarted.
- **Each fix file opens with a doc comment:** `VF-NNN · NAME`, then **THE PROBLEM** (what is
  broken, in which book/package and document, how it was measured, with dates and versions) and
  **THE FIX**. That comment holds the full write-up; the register row is its summary. Keep the
  pure logic exported (e.g. `resolveShimChains(table)`) so a suite can test it without a world.
- **Correct at runtime; never edit the vendor's pack.** Fix the data as it loads or prepares
  (hooks, or the system's tables at `setup`). That way every copy is fixed, including items
  already on actors.
- **Be a no-op on already-correct data,** so an upstream fix is never applied twice and the
  retirement check can confirm the fix has gone quiet.
- The setting `hint` opens with `(VF-NNN)` and says in plain table language what was wrong and
  what "on" does. Wrap `setup`/`ready` work in `try/catch` and log with the `TITLE` prefix, so
  one broken fix cannot stop the world loading.
- Author "Matthew Sippel", GitHub `Txpple`, MIT license. The dnd5e system relationship and the
  Foundry compatibility (minimum 13 / verified 14) match the sisters' `module.json`.

## The register (`REGISTER.md`)

`REGISTER.md` is the single, clean list of every vendor fix. It is **one Markdown table, one row
per fix**, readable as-is by a person and parsed by `tools/check-register.mjs` (`parseRegister`
is exported for any other tool, and `--json` emits the rows). **A fix is not done until its row
is complete and lands in the same commit as the code.** A row with no code behind it, or a file
in `scripts/patches/` with no live row, fails the check.

The table sits between `<!-- register:start -->` and `<!-- register:end -->`. The columns are
fixed, in this order. Changing them means changing `COLUMNS` in the checker in the same commit.

| Column | Contents |
| --- | --- |
| ID | `VF-001`, `VF-002`, …, in row order. Never reused, never renumbered. |
| Status | `active`, `upstream-fixed` (the vendor has fixed it; ours is a no-op pending removal), or `retired` |
| Vendor | Publisher or maintainer that owns the bug |
| Package | Foundry package id where the bug lives (`dnd-players-handbook`, `dnd5e`, …) |
| Source | Book or component (PHB, DMG, MM, a system class), with the pack id if relevant |
| Documents | Affected documents, UUIDs where known |
| Bug | What is wrong in the data, and what it does at the table |
| Fix | What the fix does, in one line |
| File | `scripts/patches/<file>.js` (must exist and cite the ID unless retired) |
| Setting | Setting key, scope, default, whether it needs a reload |
| Measured on | Upstream versions tested against, with dates |
| Dependents | Every module that relies on the fix, and what it relies on (`none known` if none) |
| Upstream report | Link to the bug report, or `not reported` |
| Retire when | How to tell the vendor has fixed it, and what the fix does then |
| Added | When and in which release |
| Retired | Release and date, or `—` while not retired |

**Cell rules, so the table stays machine-readable:**
- Never put a `|` in a cell. Separate several values with `; `.
- Use `—` for an empty value; a blank cell fails the check.
- Keep cells plain text: no links or line breaks.
- Rows are never deleted. A retired fix keeps its row, with `Status` set to `retired` and
  `Retired` filled in.

**Dependents are part of the contract.** When work in a sister repo turns out to rely on a
vendor fix, add that module to the row. Before changing or retiring a fix, read its Dependents
and tell the user which modules are affected. When a vendor package updates, walk the `active`
rows and run each Retire-when check.

## Test environment

- **The LOCAL sandbox is the test box, never prod.** It is a byte copy of the Molten prod world
  run headless: `node ../fvtt-mcp-dnd5e/scripts/local-foundry.mjs start|stop|status|restart`.
  Never launch the Electron app for suites.
- **Deploy to the sandbox:** `node ../fvtt-mcp-dnd5e/scripts/deploy-house-module.mjs fvtt-mod-vendorfixes --local`.
  Restart the sandbox when `module.json` changes. A world reload is enough for script edits.
  A sandbox refresh from prod wipes locally deployed modules, so re-deploy after every refresh.
- **Suites** use the MCP repo's Foundry client (`fvtt-mcp-dnd5e/client`, a `file:` devDependency;
  run `npm install` once; credentials come from that repo's `.env`; the suite identity is
  "Tester Assistant"). The module must be enabled in the sandbox world. Disconnect the MCP
  bridge (`disconnect-bridge`) before a suite or a restart, because one connected user blocks
  the restart.
- The `foundry-local5e` MCP tools (sandbox) are good for inspecting the vendor documents a fix
  targets (`read-pack`, `get-compendium-entry`, `search-compendium`).
- **Prod (Molten):** deploy only on the user's explicit say-so, using the same script with
  `FOUNDRY_HOST=molten` and without `--local`. A `module.json` change needs the prod process
  restarted, which is not ours to do. Never force-reload the user's prod window.

## Release ritual

Bump `version` and the `download` URL in `module.json` together; `build-release.ps1` refuses a
mismatch. Make one `release:` commit, tag `vX.Y.Z`, and push with tags. Then run
`gh release create vX.Y.Z --notes-file dist/RELEASE-NOTES.md dist/fvtt-mod-vendorfixes.zip module.json`.
The zip entries must use forward slashes; the script writes them that way and verifies it.

## Retiring Misc Patches

Each outward step waits for the user's go-ahead.

1. ~~This repo: create `Txpple/fvtt-mod-vendorfixes`, release v1.0.0.~~ Done 2026-09-25.
2. ~~Sandbox: enable Vendor Fixes, run `smoke-shim-chains` with both modules on, then with Misc
   Patches off.~~ Done 2026-09-25: 6/6 both times. The sandbox world now has Vendor Fixes on
   and Misc Patches off; a refresh from prod undoes that until step 3 is done.
3. ~~Prod: install Vendor Fixes and enable it, then disable Misc Patches.~~ Done 2026-09-25:
   v1.0.0 installed through `register-module.mjs`, switched with `configure-modules.mjs`, world
   restarted. Read back live: Vendor Fixes on, Misc Patches off, `shimChains` on,
   `movement.speed` → `movement.speeds.walk` (dnd5e 6.0.5, Foundry 14.368).
4. ~~Misc Patches: a final commit pointing here, then archive the GitHub repo.~~ Done
   2026-09-25 (archived, read-only).
5. ~~Sister docs repointed to Vendor Fixes (Battle Flow, FX Studio).~~ Done 2026-09-25. The old
   teleport patch is not to be mentioned anywhere (user, 2026-09-25: *"the teleport fix is
   ancient history forget it completely"*).

The retirement is complete. Misc Patches is still installed on prod but disabled; uninstalling
it is optional and needs the user's say-so.
