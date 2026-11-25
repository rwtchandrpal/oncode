const { LOWER } = require("../lib/rng");

module.exports = {
  samples: [{ s: "abba" }, { s: "xyz" }, { s: "aaa" }],

  hidden(rng) {
    let pattern = "a";
    for (const c of "bcdefghi") pattern = pattern + c + pattern; // abacaba... (511 chars)
    return [
      { note: "single letter", args: { s: "q" } },
      { note: "two different letters", args: { s: "ab" } },
      { note: "n=1000 all the same letter", args: { s: "z".repeat(1000) } },
      { note: "n=1000 alphabet ab", args: { s: rng.string(1000, "ab") } },
      { note: "n=1000 full alphabet", args: { s: rng.string(1000, LOWER) } },
      { note: "nested palindrome pattern (511)", args: { s: pattern } },
      { note: "n=999 alphabet abc", args: { s: rng.string(999, "abc") } },
    ];
  },

  validate({ s }) {
    if (s.length < 1 || s.length > 1000) throw new Error("length out of range");
    if (!/^[a-z]+$/.test(s)) throw new Error("non-lowercase character");
  },
};
