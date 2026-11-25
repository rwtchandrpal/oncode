const { LOWER, PRINTABLE } = require("../lib/rng");

module.exports = {
  samples: [{ s: "tmmzuxt" }, { s: "aaaa" }, { s: "" }],

  hidden(rng) {
    const all = PRINTABLE.split("");
    let blocks = "";
    while (blocks.length < 49000) blocks += rng.shuffle(all.slice()).join("");
    return [
      { note: "single space", args: { s: " " } },
      { note: "left edge must not move back (abba)", args: { s: "abba" } },
      { note: "two distinct characters", args: { s: "au" } },
      { note: "large n=50000 random printable", args: { s: rng.string(50000, PRINTABLE) } },
      { note: "large n=50000 lowercase", args: { s: rng.string(50000, LOWER) } },
      { note: "large, shuffled blocks of all 95 characters", args: { s: blocks } },
      { note: "n=10000 alphabet repeated", args: { s: LOWER.repeat(385).slice(0, 10000) } },
    ];
  },

  validate({ s }) {
    if (s.length > 5e4) throw new Error("length out of range");
    if (!/^[\x20-\x7e]*$/.test(s)) throw new Error("non-printable character");
  },
};
