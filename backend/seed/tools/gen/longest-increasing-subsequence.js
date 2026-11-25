const B = 1e4;

module.exports = {
  samples: [{ nums: [3, 1, 4, 1, 5, 9, 2, 6] }, { nums: [5, 5, 5] }, { nums: [1, 2, 3, 0] }],

  hidden(rng) {
    return [
      { note: "single element", args: { nums: [7] } },
      { note: "min then max", args: { nums: [-B, B] } },
      { note: "n=2500 strictly decreasing", args: { nums: rng.array(2500, (i) => B - i * 8) } },
      { note: "n=2500 strictly increasing", args: { nums: rng.array(2500, (i) => -B + i * 8) } },
      { note: "n=2500 random", args: { nums: rng.array(2500, () => rng.int(-B, B)) } },
      { note: "n=2500 many duplicates (0..10)", args: { nums: rng.array(2500, () => rng.int(0, 10)) } },
      { note: "n=2500 noisy upward trend", args: { nums: rng.array(2500, (i) => Math.max(-B, Math.min(B, -B + i * 8 + rng.int(-300, 300)))) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 2500) throw new Error("length out of range");
    if (nums.some((v) => v < -B || v > B)) throw new Error("value out of range");
  },
};
