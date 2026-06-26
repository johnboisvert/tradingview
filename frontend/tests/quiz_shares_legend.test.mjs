// Smoke test for the new "Légende" badge logic in routes/quiz_shares.js.
// Verifies that:
//  1. Lifetime shares are tracked per email (across pruning).
//  2. Legend badge unlocks at the 50th lifetime share (not before).
//  3. /api/v1/quiz/me-shares exposes lifetime_shares & legend_progress_pct.
//
// Run with:
//   cd /app/work/tv_repo/frontend && node --test tests/quiz_shares_legend.test.mjs
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const SHARES_FILE = path.join(DATA_DIR, "quiz_shares.json");
let backupContent = null;

async function startServer(app) {
  return new Promise((resolve) => {
    const srv = http.createServer(app);
    srv.listen(0, () => resolve(srv));
  });
}

async function postJson(srv, path, body, ip = "1.2.3.4") {
  const port = srv.address().port;
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      host: "127.0.0.1", port, path, method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        "X-Forwarded-For": ip,
      },
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function getJson(srv, urlPath) {
  const port = srv.address().port;
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    }).on("error", reject);
  });
}

describe("quiz_shares Legend badge", () => {
  let srv;

  beforeEach(async () => {
    // Backup existing shares file then wipe for a clean slate.
    if (fs.existsSync(SHARES_FILE)) {
      backupContent = fs.readFileSync(SHARES_FILE, "utf8");
      fs.unlinkSync(SHARES_FILE);
    } else {
      backupContent = null;
    }
    // Fresh module import to reset state.
    const mod = await import(`../routes/quiz_shares.js?cache=${Date.now()}`);
    const app = express();
    app.use(express.json());
    // Trust X-Forwarded-For so we can fake unique IPs per call.
    app.set("trust proxy", true);
    mod.default(app);
    srv = await startServer(app);
  });

  afterEach(async () => {
    if (srv) await new Promise((r) => srv.close(r));
    // Restore original
    if (backupContent !== null) fs.writeFileSync(SHARES_FILE, backupContent);
    else if (fs.existsSync(SHARES_FILE)) fs.unlinkSync(SHARES_FILE);
  });

  test("Legend NOT unlocked at 49 shares; unlocked at 50; lifetime tracked", async () => {
    const email = "legend@cryptoia.test";
    // Send 49 unique shares (rotate platforms + fake IPs to avoid dedupe).
    const platforms = ["twitter", "facebook", "linkedin", "whatsapp", "telegram", "copy", "native"];
    for (let i = 0; i < 49; i++) {
      const plat = platforms[i % platforms.length];
      const ip = `10.0.${Math.floor(i / 256)}.${i % 256}`;
      const res = await postJson(srv, "/api/v1/quiz/share", { profile: "hodler", platform: plat, email }, ip);
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true, `iter ${i}`);
    }
    const me49 = await getJson(srv, `/api/v1/quiz/me-shares?email=${encodeURIComponent(email)}`);
    assert.equal(me49.body.lifetime_shares, 49, "lifetime should be 49");
    assert.equal(me49.body.legend, false, "Legend must not be unlocked yet");
    assert.equal(me49.body.legend_threshold, 50);

    // 50th share — unlocks Legend
    const trigger = await postJson(srv, "/api/v1/quiz/share", { profile: "hodler", platform: "copy", email }, "10.99.99.99");
    assert.equal(trigger.body.legend_just_unlocked, true, "Legend just unlocked at 50");
    assert.equal(trigger.body.legend, true);
    assert.equal(trigger.body.user_lifetime_shares, 50);

    // Verify subsequent share does NOT re-trigger but legend remains true
    const after = await postJson(srv, "/api/v1/quiz/share", { profile: "scalper", platform: "twitter", email }, "10.99.99.100");
    assert.equal(after.body.legend, true);
    assert.equal(after.body.legend_just_unlocked, false);
    assert.equal(after.body.user_lifetime_shares, 51);
  });

  test("/influencers endpoint exposes legend_threshold and is_legend flag", async () => {
    const email = "le2@cryptoia.test";
    // 5 shares (deduped per platform/6h) → Influencer
    const platforms = ["twitter", "facebook", "linkedin", "whatsapp", "telegram"];
    for (let i = 0; i < platforms.length; i++) {
      await postJson(srv, "/api/v1/quiz/share", { profile: "swing", platform: platforms[i], email }, `20.0.0.${i}`);
    }
    const inf = await getJson(srv, "/api/v1/quiz/influencers?limit=10");
    assert.equal(inf.body.ok, true);
    assert.equal(inf.body.legend_threshold, 50);
    assert.equal(typeof inf.body.legends_count, "number");
    const me = inf.body.influencers.find((x) => x.lifetime_shares >= 5);
    assert.ok(me, "should find our user in influencers list");
    assert.equal(me.is_legend, false);
  });
});
