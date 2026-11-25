module.exports = {
  samples: [{ nums: [1, 2, 0, 1, 3] }, { nums: [2, 1, 0, 4] }, { nums: [0] }],

  hidden(rng) {
    // all 1s except a 0 that nothing can jump over
    const trap = rng.array(60000, () => 1);
    trap[45000] = 0;
    return [
      { note: "stuck at start", args: { nums: [0, 1] } },
      { note: "one step", args: { nums: [1, 0] } },
      { note: "jumping to the farthest point is a trap", args: { nums: [2, 3, 0, 0, 1] } },
      { note: "n=1000 random 0..3", args: { nums: rng.array(1000, () => rng.int(0, 3)) } },
      { note: "large n=60000 all ones", args: { nums: rng.array(60000, () => 1) } },
      { note: "large n=60000, a zero at 45000", args: { nums: trap } },
      { note: "large n=30000, one huge jump", args: { nums: rng.array(30000, (i) => (i === 0 ? 100000 : rng.int(0, 1))) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < 0 || v > 1e5)) throw new Error("value out of range");
  },
};
