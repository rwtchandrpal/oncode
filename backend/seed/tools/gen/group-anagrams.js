const { LOWER } = require("../lib/rng");

module.exports = {
  samples: [
    { strs: ["listen", "silent", "google", "enlist", "banana"] },
    { strs: ["", ""] },
    { strs: ["abc", "bca", "xyz"] },
  ],

  hidden(rng) {
    const shuffle = (s) => rng.shuffle(s.split("")).join("");
    const base = rng.string(12, LOWER);
    return [
      { note: "single string", args: { strs: ["a"] } },
      { note: "same letters, different counts", args: { strs: ["aab", "abb", "bab", "aba"] } },
      { note: "repeated identical strings and empties", args: { strs: ["x", "x", "", "x", ""] } },
      { note: "n=10000 short words over abc", args: { strs: rng.array(10000, () => rng.string(rng.int(1, 4), "abc")) } },
      { note: "n=5000 anagrams of one word", args: { strs: rng.array(5000, () => shuffle(base)) } },
      { note: "n=1000 strings of length 100", args: { strs: rng.array(1000, (i) => (i % 2 ? shuffle(base.repeat(8) + "abcd") : rng.string(100, "abcdef"))) } },
      { note: "n=10000 random words", args: { strs: rng.array(10000, () => rng.string(rng.int(0, 8), LOWER)) } },
    ];
  },

  validate({ strs }) {
    if (strs.length < 1 || strs.length > 1e4) throw new Error("count out of range");
    for (const s of strs) {
      if (s.length > 100 || !/^[a-z]*$/.test(s)) throw new Error("bad string");
    }
  },
};
