const { LOWER } = require("../lib/rng");

module.exports = {
  samples: [
    { s: "listen", t: "silent" },
    { s: "rocket", t: "pocket" },
    { s: "abc", t: "abcc" },
  ],

  hidden(rng) {
    const shuffled = (s) => rng.shuffle(s.split("")).join("");
    const mid = rng.string(1000, LOWER);
    const big = rng.string(50000, LOWER);
    const bigOff = shuffled(big).split("");
    // change one letter to a different one: same length, counts differ by one in two letters
    bigOff[31337] = bigOff[31337] === "z" ? "a" : String.fromCharCode(bigOff[31337].charCodeAt(0) + 1);
    const lenDiff = rng.string(3000, LOWER);
    return [
      { note: "single equal letters", args: { s: "a", t: "a" } },
      { note: "single different letters", args: { s: "a", t: "b" } },
      { note: "same letters, different counts", args: { s: "aaab", t: "abbb" } },
      { note: "n=1000 shuffled copy", args: { s: mid, t: shuffled(mid) } },
      { note: "t is s with one extra letter", args: { s: lenDiff, t: shuffled(lenDiff + "q") } },
      { note: "large n=50000 shuffled copy", args: { s: big, t: shuffled(big) } },
      { note: "large n=50000, one letter changed", args: { s: big, t: bigOff.join("") } },
    ];
  },

  validate({ s, t }) {
    for (const x of [s, t]) {
      if (x.length < 1 || x.length > 5e4) throw new Error("length out of range");
      if (!/^[a-z]+$/.test(x)) throw new Error("non-lowercase character");
    }
  },
};
