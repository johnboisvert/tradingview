#!/usr/bin/env node
// Targeted TypeScript regression guard.
// Catches the class of bug that crashed /challenge in prod ("fmtPrice is not defined"):
//   - TS2304 "Cannot find name 'X'"          → missing import / typo
//   - TS2305 "Module has no exported member" → import name mismatch
//   - TS2552 "Cannot find name 'X'. Did you mean..." → ditto
//
// Why not just `tsc --noEmit`?
// The full strict check produces 20+ legacy errors (PlanPrices types, Uint8Array
// generics, etc.) that are not blocking and would prevent us from shipping. By
// filtering for the 3 codes above we catch runtime-breaking issues only.
//
// Run:  yarn typecheck:undefs
// Exit: 0 on pass, 1 on fail.
import { spawnSync } from "node:child_process";

const CODES = ["TS2304", "TS2305", "TS2552"];
// Config-level errors abort type-checking entirely → the guard would pass
// without actually checking anything. Treat them as failures too.
const FATAL_CONFIG_CODES = ["TS2688", "TS5083", "TS18003"];
const r = spawnSync(
  "npx",
  ["tsc", "--noEmit", "-p", "tsconfig.app.json"],
  { encoding: "utf8" }
);
const out = (r.stdout || "") + (r.stderr || "");
const fatal = out.split("\n").filter((l) => FATAL_CONFIG_CODES.some((c) => l.includes(c)));
if (fatal.length > 0) {
  console.error("\n❌ TYPECHECK ABORTED — tsc config error prevents any real checking:\n");
  for (const l of fatal) console.error("  " + l);
  process.exit(1);
}
const lines = out
  .split("\n")
  .filter((l) => CODES.some((c) => l.includes(c)));

if (lines.length > 0) {
  console.error(
    `\n❌ TYPECHECK FAILED — ${lines.length} undefined symbol / missing import error(s):\n`
  );
  for (const l of lines) console.error("  " + l);
  console.error(
    "\nFix: add the missing imports, fix the typo, or export the symbol.\n" +
      "This guard exists because Vite's build does NOT run tsc and these\n" +
      "errors crash the app at runtime (ErrorBoundary screen)."
  );
  process.exit(1);
}

console.log("✅ TYPECHECK PASSED — no undefined symbols / missing imports");
process.exit(0);
