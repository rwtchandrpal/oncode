const express = require("express");
const mongoose = require("mongoose");
const client = require("../config/redis");

// Liveness / readiness probes (OPS-01). Neither depends on Judge0, which is often switched off; the
// Judge0 diagnostic stays admin-only at GET /submission/health.
const healthRouter = express.Router();

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

const check = async (fn) => {
  try {
    await withTimeout(fn(), 2000);
    return "ok";
  } catch {
    return "down";
  }
};

// Process is up and serving HTTP.
healthRouter.get("/healthz", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok" });
});

// Dependencies needed to serve real traffic are reachable.
healthRouter.get("/readyz", async (req, res) => {
  const [mongo, redis] = await Promise.all([
    check(() => mongoose.connection.db.admin().ping()),
    check(() => client.ping()),
  ]);
  const ready = mongo === "ok" && redis === "ok";
  res.set("Cache-Control", "no-store");
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable", checks: { mongo, redis } });
});

module.exports = healthRouter;
