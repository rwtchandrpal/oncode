const { LOWER } = require("../lib/rng");

const LETTERS = LOWER + LOWER.toUpperCase();

// All shortest windows (as start indexes). Returns { len, starts } or { len: 0, starts: [] }.
const shortest = (s, t) => {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  const have = new Map();
  let missing = t.length, left = 0, best = Infinity;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (need.has(c)) {
      have.set(c, (have.get(c) || 0) + 1);
      if (have.get(c) <= need.get(c)) missing--;
    }
    while (missing === 0) {
      best = Math.min(best, right - left + 1);
      const d = s[left++];
      if (need.has(d)) {
        have.set(d, have.get(d) - 1);
        if (have.get(d) < need.get(d)) missing++;
      }
    }
  }
  if (best === Infinity) return { len: 0, starts: [] };
  // count windows of exactly `best` characters that are valid
  const starts = [];
  const win = new Map();
  let ok = 0; // number of letters whose count is satisfied
  const sat = (c) => (win.get(c) || 0) >= need.get(c);
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (need.has(c)) { const before = sat(c); win.set(c, (win.get(c) || 0) + 1); if (!before && sat(c)) ok++; }
    if (i >= best) {
      const d = s[i - best];
      if (need.has(d)) { const before = sat(d); win.set(d, win.get(d) - 1); if (before && !sat(d)) ok--; }
    }
    if (i >= best - 1 && ok === need.size) starts.push(i - best + 1);
  }
  return { len: best, starts };
};

const unique = (s, t) => {
  const r = shortest(s, t);
  return r.len === 0 || r.starts.length === 1;
};

// Random s from `alphabet`, plus t; retried until the answer is unique (and present if wanted).
const make = (rng, n, alphabet, tLen, tAlphabet, wantFound) => {
  for (;;) {
    const s = rng.string(n, alphabet);
    const t = rng.string(tLen, tAlphabet);
    const r = shortest(s, t);
    if ((r.len > 0) === wantFound && unique(s, t)) return { s, t };
  }
};

module.exports = {
  samples: [
    { s: "QXAYBZCQ", t: "ABC" },
    { s: "aa", t: "aa" },
    { s: "a", t: "b" },
  ],

  hidden(rng) {
    // a big string over "abcdefgh" with the rare letters X, Y, Z planted once each, close together
    const filler = rng.string(90000, "abcdefgh").split("");
    filler[60000] = "X";
    filler[60040] = "Y";
    filler[60013] = "Z";
    return [
      { note: "single equal letter", args: { s: "a", t: "a" } },
      { note: "case matters", args: { s: "aA", t: "A" } },
      { note: "t longer than s", args: { s: "abc", t: "abcc" } },
      { note: "t with repeated letters", args: make(rng, 2000, "abcdefghij", 6, "aab", true) },
      { note: "large n=90000, rare letters planted", args: { s: filler.join(""), t: "ZYX" } },
      { note: "large n=90000, t of 40 letters", args: make(rng, 90000, LETTERS, 40, LETTERS, true) },
      { note: "large n=90000, answer is empty", args: { s: rng.string(90000, LOWER), t: "aZ" } },
    ];
  },

  validate({ s, t }) {
    for (const x of [s, t]) {
      if (x.length < 1 || x.length > 1e5) throw new Error("length out of range");
      if (!/^[A-Za-z]+$/.test(x)) throw new Error("non-letter character");
    }
    if (!unique(s, t)) throw new Error("the shortest window is not unique");
  },
};
