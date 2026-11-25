module.exports = {
  samples: [
    { a: 2, b: 5 },
    { a: -4, b: 9 },
    { a: -7, b: -8 },
  ],

  hidden(rng) {
    return [
      { note: "zeros", args: { a: 0, b: 0 } },
      { note: "both maximum", args: { a: 1000, b: 1000 } },
      { note: "both minimum", args: { a: -1000, b: -1000 } },
      { note: "opposites cancel", args: { a: -1000, b: 1000 } },
      { note: "carry chain through -1", args: { a: -1, b: 1 } },
      { note: "random", args: { a: rng.int(-1000, 1000), b: rng.int(-1000, 1000) } },
      { note: "random negative + positive", args: { a: rng.int(-1000, -1), b: rng.int(1, 1000) } },
    ];
  },

  validate({ a, b }) {
    for (const v of [a, b]) if (v < -1000 || v > 1000) throw new Error("value out of range");
  },
};
