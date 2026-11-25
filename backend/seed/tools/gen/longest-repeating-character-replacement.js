const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

module.exports = {
  samples: [
    { s: "XYYX", k: 1 },
    { s: "ABCD", k: 0 },
    { s: "BAAAB", k: 2 },
  ],

  hidden(rng) {
    const big = rng.string(100000, "AB");
    return [
      { note: "single letter, k=0", args: { s: "A", k: 0 } },
      { note: "single letter, k=1", args: { s: "Z", k: 1 } },
      { note: "two letters, k=0", args: { s: "AB", k: 0 } },
      { note: "large n=100000 AB, k=1000", args: { s: big, k: 1000 } },
      { note: "large n=100000 all letters, k=0", args: { s: rng.string(100000, UPPER), k: 0 } },
      { note: "large n=100000, k = length", args: { s: rng.string(100000, UPPER), k: 100000 } },
      { note: "n=50000 ABC, k=5000", args: { s: rng.string(50000, "ABC"), k: 5000 } },
    ];
  },

  validate({ s, k }) {
    if (s.length < 1 || s.length > 1e5) throw new Error("length out of range");
    if (!/^[A-Z]+$/.test(s)) throw new Error("non-uppercase character");
    if (k < 0 || k > s.length) throw new Error("k out of range");
  },
};
