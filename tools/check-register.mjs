/**
 * Register check: REGISTER.md parses as the machine-readable table CLAUDE.md defines, and it
 * agrees with the code. Offline, no dependencies, touches no world.
 *
 *   node tools/check-register.mjs          check, exit 1 on any problem
 *   node tools/check-register.mjs --json   print the register as JSON (after checking)
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COLUMNS = ["ID", "Status", "Vendor", "Package", "Source", "Documents", "Bug", "Fix", "File",
  "Setting", "Measured on", "Dependents", "Upstream report", "Retire when", "Added", "Retired"];
const STATUSES = ["active", "upstream-fixed", "retired"];
const NONE = "—";

/**
 * Parse the table between the register markers into row objects keyed by column name.
 * @param {string} text   REGISTER.md
 * @returns {{rows: Record<string, string>[], errors: string[]}}
 */
export function parseRegister(text) {
  const errors = [];
  const block = text.match(/<!-- register:start -->\r?\n([\s\S]*?)<!-- register:end -->/);
  if ( !block ) return { rows: [], errors: ["register markers not found"] };
  const lines = block[1].split(/\r?\n/).filter(l => l.trim());
  const cells = l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const header = cells(lines[0] ?? "");
  if ( header.join("|") !== COLUMNS.join("|") ) errors.push(`header must be exactly: ${COLUMNS.join(" | ")}`);
  const rows = [];
  for ( const [i, line] of lines.slice(2).entries() ) {
    const c = cells(line);
    if ( c.length !== COLUMNS.length ) {
      errors.push(`row ${i + 1}: ${c.length} cells, expected ${COLUMNS.length} (a "|" inside a cell?)`);
      continue;
    }
    rows.push(Object.fromEntries(COLUMNS.map((k, j) => [k, c[j]])));
  }
  return { rows, errors };
}

export function check() {
  const { rows, errors } = parseRegister(readFileSync(join(ROOT, "REGISTER.md"), "utf8"));
  const seen = new Set();
  for ( const [i, r] of rows.entries() ) {
    const at = r.ID || `row ${i + 1}`;
    if ( !/^VF-\d{3}$/.test(r.ID) ) errors.push(`${at}: ID must look like VF-001`);
    else if ( r.ID !== `VF-${String(i + 1).padStart(3, "0")}` ) errors.push(`${at}: IDs must run in order from VF-001`);
    if ( seen.has(r.ID) ) errors.push(`${at}: duplicate ID`);
    seen.add(r.ID);
    if ( !STATUSES.includes(r.Status) ) errors.push(`${at}: Status must be one of ${STATUSES.join(", ")}`);
    for ( const k of COLUMNS ) if ( !r[k] ) errors.push(`${at}: ${k} is empty (use ${NONE})`);
    if ( (r.Status === "retired") === (r.Retired === NONE) ) errors.push(`${at}: Retired is set exactly when Status is retired`);
    if ( r.Status !== "retired" ) {
      const file = join(ROOT, r.File);
      if ( !existsSync(file) ) errors.push(`${at}: File ${r.File} does not exist`);
      else if ( !readFileSync(file, "utf8").includes(r.ID) ) errors.push(`${at}: ${r.File} does not cite ${r.ID}`);
    }
  }
  // Every shipped fix file is registered.
  const patches = join(ROOT, "scripts", "patches");
  const live = new Set(rows.filter(r => r.Status !== "retired").map(r => r.File));
  if ( existsSync(patches) ) for ( const f of readdirSync(patches).filter(f => f.endsWith(".js")) ) {
    if ( !live.has(`scripts/patches/${f}`) ) errors.push(`scripts/patches/${f} has no live register row`);
  }
  // The README's fixes table lists the same fixes, in order, with the same status.
  const readme = readFileSync(join(ROOT, "README.md"), "utf8").match(/<!-- fixes:start -->\r?\n([\s\S]*?)<!-- fixes:end -->/);
  if ( !readme ) errors.push("README.md: fixes table markers not found");
  else {
    const listed = readme[1].split(/\r?\n/).filter(l => l.trim()).slice(2)
      .map(l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
    const want = rows.map(r => `${r.ID} ${r.Status}`).join(", ");
    const got = listed.map(c => `${c[0]} ${c[2]}`).join(", ");
    if ( got !== want ) errors.push(`README.md fixes table must list ${want || "nothing"}; it lists ${got || "nothing"}`);
  }
  return { rows, errors };
}

// Run only as a script, so another tool can import parseRegister without the check firing.
if ( process.argv[1] && (fileURLToPath(import.meta.url) === process.argv[1]) ) {
  const { rows, errors } = check();
  if ( errors.length ) {
    for ( const e of errors ) console.error(`✗ ${e}`);
    process.exit(1);
  }
  if ( process.argv.includes("--json") ) console.log(JSON.stringify(rows, null, 2));
  else console.log(`✓ register OK — ${rows.length} fix(es)`);
}
