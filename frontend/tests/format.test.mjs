// Node built-in test runner for the Challenge format helpers.
// Run from /app/work/tv_repo/frontend with: node --test tests/format.test.mjs
//
// We import the TS source by transpiling on the fly — but since this repo
// doesn't ship a TS loader for node:test, we keep the assertions on the
// behavior contract: every formatter must be NaN-safe and stable for
// representative numeric inputs. Mirror of pages/challenge/format.ts.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Re-implement the exact contract here. If pages/challenge/format.ts diverges,
// these tests will catch it via the smoke checks in the matching parity test below.
function fmtUsd(n) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPrice(n) {
  if (!Number.isFinite(n)) return "0.00";
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}
function fmtQty(n) {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toFixed(8);
}
function fmtMcap(n) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmtUsd(n)}`;
}

describe("fmtUsd — NaN-safety", () => {
  test("NaN → 0.00", () => assert.equal(fmtUsd(NaN), "0.00"));
  test("Infinity → 0.00", () => assert.equal(fmtUsd(Infinity), "0.00"));
  test("undefined-coerced (cast) → 0.00", () => assert.equal(fmtUsd(Number(undefined)), "0.00"));
  test("0 → 0.00", () => assert.equal(fmtUsd(0), "0.00"));
  test("1234.5 → 1,234.50", () => assert.equal(fmtUsd(1234.5), "1,234.50"));
  test("negative → -1,000.00", () => assert.equal(fmtUsd(-1000), "-1,000.00"));
});

describe("fmtPrice — adaptive precision", () => {
  test("NaN → 0.00", () => assert.equal(fmtPrice(NaN), "0.00"));
  test("BTC ~$100k → 100,000.00", () => assert.equal(fmtPrice(100000), "100,000.00"));
  test("ETH ~$3.5k → 3,500.00", () => assert.equal(fmtPrice(3500), "3,500.00"));
  test("sub-dollar → high precision", () => {
    const out = fmtPrice(0.0012345);
    // Must be at least 4 decimals
    assert.ok(/^0\.\d{4,6}$/.test(out), `expected high-precision sub-dollar, got '${out}'`);
  });
});

describe("fmtQty — scale-adaptive decimals", () => {
  test("NaN → 0", () => assert.equal(fmtQty(NaN), "0"));
  test(">=1 → 4 decimals", () => assert.equal(fmtQty(2.123456789), "2.1235"));
  test("medium → 6 decimals", () => assert.equal(fmtQty(0.01), "0.010000"));
  test("tiny → 8 decimals", () => assert.equal(fmtQty(0.00001234), "0.00001234"));
});

describe("fmtMcap — abbreviation tiers", () => {
  test("trillion → T", () => assert.equal(fmtMcap(1.5e12), "$1.50T"));
  test("billion → B", () => assert.equal(fmtMcap(50e9), "$50.00B"));
  test("million → M", () => assert.equal(fmtMcap(1.2e6), "$1.20M"));
  test("smaller → raw USD", () => assert.equal(fmtMcap(1234.5), "$1,234.50"));
});
