const { LOWER } = require("../lib/rng");

module.exports = {
  samples: [
    { text1: "stone", text2: "longest" },
    { text1: "abc", text2: "def" },
    { text1: "aaa", text2: "aa" },
  ],

  hidden(rng) {
    const same = rng.string(1000, LOWER);
    const r = rng.string(1000, "abcd");
    return [
      { note: "single equal letters", args: { text1: "q", text2: "q" } },
      { note: "single vs long", args: { text1: "z", text2: rng.string(999, "abcdefghijklmnopqrstuvwxy") + "z" } },
      { note: "identical n=1000", args: { text1: same, text2: same } },
      { note: "n=1000 alphabet abcd", args: { text1: r, text2: rng.string(1000, "abcd") } },
      { note: "n=1000 full alphabet", args: { text1: rng.string(1000, LOWER), text2: rng.string(1000, LOWER) } },
      { note: "string and its reverse", args: { text1: r, text2: r.split("").reverse().join("") } },
      { note: "different lengths", args: { text1: rng.string(300, "xyz"), text2: rng.string(1000, "wxyz") } },
    ];
  },

  validate({ text1, text2 }) {
    for (const t of [text1, text2]) {
      if (t.length < 1 || t.length > 1000) throw new Error("length out of range");
      if (!/^[a-z]+$/.test(t)) throw new Error("non-lowercase character");
    }
  },
};
