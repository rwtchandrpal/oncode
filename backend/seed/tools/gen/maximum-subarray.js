const MAX = 1e4;

module.exports = {
  samples: [{ nums: [3, -4, 5, -1, 2, -6, 1] }, { nums: [-3, -1, -2] }, { nums: [6] }],

  hidden(rng) {
    return [
      { note: "single minimum value", args: { nums: [-MAX] } },
      { note: "n=1000 all negative", args: { nums: rng.array(1000, () => rng.int(-MAX, -1)) } },
      { note: "n=1000 all positive", args: { nums: rng.array(1000, () => rng.int(1, MAX)) } },
      { note: "n=1000 random", args: { nums: rng.array(1000, () => rng.int(-MAX, MAX)) } },
      { note: "zeros and negatives", args: { nums: [-5, 0, -3, 0, -1] } },
      { note: "large n=30000 random", args: { nums: rng.array(30000, () => rng.int(-MAX, MAX)) } },
      { note: "large n=30000, slight positive drift", args: { nums: rng.array(30000, () => rng.int(-MAX + 50, MAX)) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < -MAX || v > MAX)) throw new Error("value out of range");
  },
};
