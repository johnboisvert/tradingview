// Smoke test for routes/coingecko_proxy.js — verifies the module exports,
// builds an Express app, hits the proxy with a fetch mock, and asserts the
// cache-on-200 / stale-on-error contracts. Run with:
//   cd /app/work/tv_repo/frontend && node --test tests/coingecko_proxy.test.mjs
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import http from "node:http";

let proxyModule;

async function startServer(app) {
  return new Promise((resolve) => {
    const srv = http.createServer(app);
    srv.listen(0, () => resolve(srv));
  });
}

async function get(srv, path) {
  const port = srv.address().port;
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on("error", reject);
  });
}

describe("routes/coingecko_proxy.js", () => {
  let originalFetch;
  let srv;

  beforeEach(async () => {
    // Fresh import each time → resets the module-level in-memory cache
    proxyModule = await import(`../routes/coingecko_proxy.js?cb=${Date.now()}`);
    originalFetch = globalThis.fetch;
  });

  test("exports default registerCoinGeckoProxy + named cgCache", () => {
    assert.equal(typeof proxyModule.default, "function");
    assert.ok(proxyModule.cgCache instanceof Map, "cgCache must be a Map");
    assert.equal(typeof proxyModule.CG_CACHE_TTL, "number");
    assert.equal(typeof proxyModule.persistCgCacheDebounced, "function");
  });

  test("on 200 — caches and serves the payload", async () => {
    const app = express();
    proxyModule.default(app);

    let upstreamHits = 0;
    globalThis.fetch = async () => {
      upstreamHits++;
      return new Response(JSON.stringify([{ id: "btc", symbol: "btc", current_price: 100000 }]), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    };

    srv = await startServer(app);
    try {
      const r1 = await get(srv, "/api/coingecko/ping");
      assert.equal(r1.status, 200);
      assert.equal(upstreamHits, 1);
      assert.match(r1.body, /btc/);
      // Second hit served from cache — no extra upstream call
      const r2 = await get(srv, "/api/coingecko/ping");
      assert.equal(r2.status, 200);
      assert.equal(upstreamHits, 1, "cache MUST prevent the second upstream hit");
    } finally {
      srv.close();
      globalThis.fetch = originalFetch;
    }
  });

  test("on upstream 502 with NO cache — returns 502", async () => {
    const app = express();
    proxyModule.default(app);

    globalThis.fetch = async () => new Response("upstream down", { status: 502 });

    srv = await startServer(app);
    try {
      const r = await get(srv, "/api/coingecko/never-cached-path");
      assert.equal(r.status, 502);
    } finally {
      srv.close();
      globalThis.fetch = originalFetch;
    }
  });

  test("on upstream error WITH cache — serves stale with X-CG-Cache=stale", async () => {
    const app = express();
    proxyModule.default(app);

    // First, populate the cache with a successful response
    let upstreamHits = 0;
    globalThis.fetch = async () => {
      upstreamHits++;
      return new Response(JSON.stringify({ cached: true }), { status: 200 });
    };

    srv = await startServer(app);
    try {
      const r1 = await get(srv, "/api/coingecko/stale-test");
      assert.equal(r1.status, 200);
      assert.equal(JSON.parse(r1.body).cached, true);

      // Manually expire by tampering with the cache timestamp
      proxyModule.cgCache.set("/stale-test", {
        ...proxyModule.cgCache.get("/stale-test"),
        timestamp: 0, // very old → forces refetch
      });

      // Now make upstream fail
      globalThis.fetch = async () => { throw new Error("ECONNRESET"); };

      const r2 = await get(srv, "/api/coingecko/stale-test");
      assert.equal(r2.status, 200);
      assert.equal(r2.headers["x-cg-cache"], "stale", "X-CG-Cache must be 'stale' on degraded reads");
      assert.equal(JSON.parse(r2.body).cached, true);
    } finally {
      srv.close();
      globalThis.fetch = originalFetch;
    }
  });
});
