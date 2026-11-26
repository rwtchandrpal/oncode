const express = require("express");
const mongoose = require("mongoose");
const client = require("../config/redis");

// Liveness / readiness probes. Neither depends on Judge0, which is often switched off; the
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

// Wake-up ping for the SPA's "server waking up" banner (free hosting sleeps when idle). No DB or Redis
// calls, so it answers as soon as the process is listening. CORS comes from the app-wide config.
healthRouter.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Dependencies needed to serve real traffic are reachable.
healthRouter.get("/readyz", async (req, res) => {
  const [mongo, redis] = await Promise.all([
    check(() => mongoose.connection.db.admin().ping()),
    check(() => client.ping()),
  ]);
  const ready = mongo === "ok" && redis === "ok";
  res.set("Cache-Control", "no-store");
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable", checks: { mongo, redis }, ...(ready ? {} : { message: "Service not ready." }) });
});

module.exports = healthRouter;
