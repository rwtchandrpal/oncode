// Distinct problem topics for the filter dropdown, cached in Redis. Admin writes call
// invalidateTopics(). Redis errors fall back to computing from MongoDB.
const client = require("../config/redis");
const logger = require("./logger");

const TOPICS_KEY = "topics:v1";
const TOPICS_TTL_SECONDS = 60 * 60; // safety net in case an invalidation is missed

const normalizeTopics = (rawTopics) => {
  const unique = new Map();
  (rawTopics || []).forEach((t) => {
    if (typeof t === "string" && t.trim()) {
      const trimmed = t.trim();
      const lower = trimmed.toLowerCase();
      if (!unique.has(lower)) unique.set(lower, trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
    }
  });
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
};

const getAllTopics = async () => {
  try {
    const cached = await client.get(TOPICS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn({ code: err.code || err.message }, "topics cache read failed");
  }
  // Required lazily to avoid a model <-> cache require cycle
  const Problem = require("../models/problem");
  const topics = normalizeTopics(await Problem.distinct("topics"));
  try {
    await client.set(TOPICS_KEY, JSON.stringify(topics), { EX: TOPICS_TTL_SECONDS });
  } catch (err) {
    logger.warn({ code: err.code || err.message }, "topics cache write failed");
  }
  return topics;
};

const invalidateTopics = async () => {
  try {
    await client.del(TOPICS_KEY);
  } catch (err) {
    logger.warn({ code: err.code || err.message }, "topics cache invalidation failed");
  }
};

module.exports = { getAllTopics, invalidateTopics, normalizeTopics, TOPICS_KEY };
