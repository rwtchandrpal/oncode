module.exports = {
  samples: [{ nums: [5, 1, 1, 5] }, { nums: [3, 10, 3] }, { nums: [4] }],

  hidden(rng) {
    return [
      { note: "single empty house", args: { nums: [0] } },
      { note: "two max houses", args: { nums: [400, 400] } },
      { note: "skip two in a row", args: { nums: [2, 1, 1, 2] } },
      { note: "n=100 alternating high/low", args: { nums: rng.array(100, (i) => (i % 2 ? rng.int(0, 50) : rng.int(300, 400))) } },
      { note: "n=100 random", args: { nums: rng.array(100, () => rng.int(0, 400)) } },
      { note: "n=100 all 400", args: { nums: rng.array(100, () => 400) } },
      { note: "n=99 random (catches exponential recursion)", args: { nums: rng.array(99, () => rng.int(0, 400)) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 100) throw new Error("length out of range");
    if (nums.some((v) => v < 0 || v > 400)) throw new Error("value out of range");
  },
};
