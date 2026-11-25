const MAX = 1e4;

module.exports = {
  samples: [{ height: [3, 1, 2, 4, 5] }, { height: [1, 1] }, { height: [2, 9, 1, 1, 9, 2] }],

  hidden(rng) {
    return [
      { note: "two zero walls", args: { height: [0, 0] } },
      { note: "two max walls", args: { height: [MAX, MAX] } },
      { note: "n=1000 increasing", args: { height: rng.array(1000, (i) => i + 1) } },
      { note: "n=1000 random", args: { height: rng.array(1000, () => rng.int(0, MAX)) } },
      { note: "large n=36000 random", args: { height: rng.array(36000, () => rng.int(0, MAX)) } },
      { note: "large n=40000, tall walls in the middle", args: { height: rng.array(40000, (i) => (i > 19000 && i < 21000 ? rng.int(9000, MAX) : rng.int(0, 99))) } },
      { note: "large n=30000, all max height", args: { height: rng.array(30000, () => MAX) } },
    ];
  },

  validate({ height }) {
    if (height.length < 2 || height.length > 1e5) throw new Error("length out of range");
    if (height.some((v) => v < 0 || v > MAX)) throw new Error("height out of range");
  },
};
