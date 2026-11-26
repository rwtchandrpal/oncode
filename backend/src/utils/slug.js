// URL slugs for problems ("Two Sum" -> "two-sum"), used by the Problem model's pre-validate hook,
// the admin update path and scripts/addSlugsToProblems.js.
const mongoose = require("mongoose");

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;
// Single path segments that GET /problem/<x> already routes elsewhere (problemRoutes.js)
const RESERVED_SLUGS = new Set(["solved"]);
// A 24-hex slug would read as an ObjectId in GET /problem/:idOrSlug
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

// Lowercase, every run of non-alphanumerics -> one hyphen, no leading/trailing hyphens.
// Leaves room for a "-NN" collision suffix within MAX_SLUG_LENGTH. Falls back to "problem".
const slugify = (title) => {
  const base = String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH - 10)
    .replace(/-+$/g, "");
  return base || "problem";
};

const isUsable = (slug) => !RESERVED_SLUGS.has(slug) && !OBJECT_ID_PATTERN.test(slug);

// First free slug among base, base-2, base-3, ... in Model (excluding the document `excludeId`).
const uniqueSlug = async (Model, title, excludeId) => {
  const base = slugify(title);
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!isUsable(candidate)) continue;
    // mongoose.trusted: the global sanitizeFilter would otherwise neutralise $ne (config/db.js)
    const filter = excludeId ? { slug: candidate, _id: mongoose.trusted({ $ne: excludeId }) } : { slug: candidate };
    if (!(await Model.exists(filter))) return candidate;
  }
};

module.exports = { SLUG_PATTERN, MAX_SLUG_LENGTH, RESERVED_SLUGS, slugify, uniqueSlug, isUsable };
