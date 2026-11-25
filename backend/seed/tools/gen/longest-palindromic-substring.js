const { LOWER, DIGITS } = require("../lib/rng");

const ALNUM = LOWER + LOWER.toUpperCase() + DIGITS;

// Set of distinct longest palindromic substrings (expand around every centre).
const longest = (s) => {
  let best = 0;
  let found = new Set();
  for (let c = 0; c < 2 * s.length - 1; c++) {
    let l = Math.floor(c / 2), r = l + (c % 2);
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    const len = r - l - 1;
    if (len > best) { best = len; found = new Set(); }
    if (len === best && len > 0) found.add(s.slice(l + 1, r));
  }
  return found;
};

// Random filler with a palindrome of `half*2 (+1)` characters planted at `at`, retried until unique.
const planted = (rng, n, half, odd, at, alphabet) => {
  for (;;) {
    const left = rng.string(half, alphabet);
    const pal = left + (odd ? rng.pick(alphabet) : "") + left.split("").reverse().join("");
    const filler = rng.string(n - pal.length, alphabet);
    const pos = Math.min(at, filler.length);
    const s = filler.slice(0, pos) + pal + filler.slice(pos);
    if (longest(s).size === 1) return s;
  }
};

const uniqueRandom = (rng, n, alphabet) => {
  for (;;) {
    const s = rng.string(n, alphabet);
    if (longest(s).size === 1) return s;
  }
};

module.exports = {
  samples: [{ s: "xracecarz" }, { s: "noonabc" }, { s: "q" }],

  hidden(rng) {
    return [
      { note: "two equal letters", args: { s: "aa" } },
      { note: "n=1000 all the same letter", args: { s: "b".repeat(1000) } },
      { note: "palindrome at the very start", args: { s: planted(rng, 300, 20, true, 0, ALNUM) } },
      { note: "palindrome at the very end", args: { s: planted(rng, 300, 25, false, 1000, ALNUM) } },
      { note: "n=1000, planted length 101", args: { s: planted(rng, 1000, 50, true, 400, ALNUM) } },
      { note: "n=1000 binary alphabet, unique answer", args: { s: uniqueRandom(rng, 1000, "ab") } },
      { note: "n=1000 digits, planted even length 60", args: { s: planted(rng, 1000, 30, false, 700, DIGITS) } },
    ];
  },

  validate({ s }) {
    if (s.length < 1 || s.length > 1000) throw new Error("length out of range");
    if (!/^[A-Za-z0-9]+$/.test(s)) throw new Error("invalid character");
    const l = longest(s);
    if (l.size !== 1) throw new Error(`${l.size} different longest palindromes`);
  },
};
