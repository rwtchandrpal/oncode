const MAX = 1e4;

module.exports = {
  samples: [{ prices: [7, 2, 5, 1, 6, 4] }, { prices: [9, 7, 4, 3] }, { prices: [2, 4, 1] }],

  hidden(rng) {
    // Random walk: the best trade is somewhere in the middle, not at the global min/max.
    let p = 5000;
    const walk = rng.array(36000, () => (p = Math.min(MAX, Math.max(0, p + rng.int(-60, 60)))));
    return [
      { note: "single day", args: { prices: [5] } },
      { note: "0 then 10000", args: { prices: [0, MAX] } },
      { note: "10000 then 0", args: { prices: [MAX, 0] } },
      { note: "all prices equal", args: { prices: rng.array(500, () => 42) } },
      { note: "n=1000 random", args: { prices: rng.array(1000, () => rng.int(0, MAX)) } },
      { note: "large n=36000 random walk", args: { prices: walk } },
      { note: "large n=30000 strictly falling", args: { prices: rng.array(30000, (i) => MAX - Math.floor(i / 3)) } },
    ];
  },

  validate({ prices }) {
    if (prices.length < 1 || prices.length > 1e5) throw new Error("length out of range");
    if (prices.some((v) => v < 0 || v > MAX)) throw new Error("price out of range");
  },
};
