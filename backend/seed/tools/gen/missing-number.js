// nums = shuffled [0, n] without `missing`
const without = (rng, n, missing) => rng.shuffle(Array.from({ length: n + 1 }, (_, i) => i).filter((v) => v !== missing));

module.exports = {
  samples: [{ nums: [3, 0, 1, 4] }, { nums: [1] }, { nums: [2, 0, 1] }],

  hidden(rng) {
    return [
      { note: "n=1, missing 1", args: { nums: [0] } },
      { note: "n=2, missing 2", args: { nums: [1, 0] } },
      { note: "n=2, missing 1", args: { nums: [2, 0] } },
      { note: "n=1000, missing random", args: { nums: without(rng, 1000, rng.int(0, 1000)) } },
      { note: "large n=30000, missing 0", args: { nums: without(rng, 30000, 0) } },
      { note: "large n=30000, missing n", args: { nums: without(rng, 30000, 30000) } },
      { note: "large n=30000, missing in middle", args: { nums: without(rng, 30000, rng.int(1, 29999)) } },
    ];
  },

  validate({ nums }) {
    const n = nums.length;
    if (n < 1 || n > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < 0 || v > n)) throw new Error("value out of [0, n]");
    if (new Set(nums).size !== n) throw new Error("values not distinct");
  },
};
