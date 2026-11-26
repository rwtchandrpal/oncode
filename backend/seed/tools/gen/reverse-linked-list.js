module.exports = {
  samples: [{ head: [3, 8, 1] }, { head: [] }, { head: [2, 9] }],

  hidden(rng) {
    return [
      { note: "single node", args: { head: [7] } },
      { note: "min and max values", args: { head: [-5000, 0, 5000] } },
      { note: "duplicates", args: { head: [4, 4, 1, 4] } },
      { note: "n=100 random", args: { head: rng.array(100, () => rng.int(-5000, 5000)) } },
      { note: "n=5000 random", args: { head: rng.array(5000, () => rng.int(-5000, 5000)) } },
      { note: "n=5000 increasing", args: { head: rng.array(5000, (i) => i - 2500) } },
      { note: "n=4999 all equal", args: { head: rng.array(4999, () => 3) } },
    ];
  },

  validate({ head }) {
    if (head.length > 5000) throw new Error("too many nodes");
    if (head.some((v) => v < -5000 || v > 5000)) throw new Error("value out of range");
  },
};
