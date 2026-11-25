// Deterministic random numbers for test generators. Each problem seeds from its slug, so a rebuild
// produces byte-identical tests.
const seedFrom = (text) => {
  let h = 0x811c9dc5; // FNV-1a
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
};

const makeRng = (seedText) => {
  let a = seedFrom(seedText);
  const next = () => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)); // inclusive
  const pick = (arr) => arr[int(0, arr.length - 1)];
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const array = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const string = (n, alphabet) => array(n, () => pick(alphabet)).join("");
  // n distinct integers from [lo, hi], in random order
  const distinct = (n, lo, hi) => {
    if (hi - lo + 1 < n) throw new Error("range too small for distinct values");
    const seen = new Set();
    const out = [];
    while (out.length < n) {
      const v = int(lo, hi);
      if (!seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  };
  return { next, int, pick, shuffle, array, string, distinct };
};

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const PRINTABLE = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");

module.exports = { makeRng, seedFrom, LOWER, DIGITS, PRINTABLE };
