const B = 1e9;

// Number of index pairs (i < j) with nums[i] + nums[j] == target.
const pairCount = (nums, target) => {
  const seen = new Map();
  let count = 0;
  for (const v of nums) {
    count += seen.get(target - v) || 0;
    seen.set(v, (seen.get(v) || 0) + 1);
  }
  return count;
};

// Large inputs with a provably unique answer: every value is even except one odd value x, and the
// target is odd, so any matching pair must contain x; its partner y = target - x appears once.
const parityCase = (rng, n, lo, hi, xPos, yPos) => {
  const half = (v) => Math.trunc(v / 2);
  const evens = rng.distinct(n - 1, half(lo), half(hi)).map((v) => v * 2);
  const y = evens[0];
  let x = rng.int(-1000, 1000) * 2 + 1;
  const nums = evens.slice(1);
  nums.splice(Math.min(xPos, yPos), 0, 0);
  nums.splice(Math.max(xPos, yPos), 0, 0);
  nums[xPos] = x;
  nums[yPos] = y;
  return { nums, target: x + y };
};

// Random case, regenerated until the answer is unique (deterministic for a fixed seed).
const randomUnique = (rng, n, lo, hi, makePair) => {
  for (;;) {
    const nums = rng.array(n, () => rng.int(lo, hi));
    const { i, j, target } = makePair(nums);
    if (i !== j && Math.abs(target) <= B && pairCount(nums, target) === 1) return { nums, target };
  }
};

module.exports = {
  samples: [
    { nums: [3, 8, 11, 2], target: 10 },
    { nums: [5, -2, 9], target: 7 },
    { nums: [6, 6], target: 12 },
  ],

  hidden(rng) {
    return [
      { note: "n=2, min and max values", args: { nums: [-B, B], target: 0 } },
      { note: "zeros as the pair", args: { nums: [0, 4, 3, 0], target: 0 } },
      { note: "negative target", args: { nums: [-3, -7, -1, 5], target: -8 } },
      {
        note: "n=100, equal values form the pair",
        args: randomUnique(rng, 100, -1000, 1000, (nums) => {
          const i = rng.int(0, 49);
          const j = rng.int(50, 99);
          nums[j] = nums[i];
          return { i, j, target: nums[i] * 2 };
        }),
      },
      {
        note: "n=500, wide values",
        args: randomUnique(rng, 500, -B / 2, B / 2, (nums) => {
          const i = rng.int(0, 499);
          const j = rng.int(0, 499);
          return { i, j, target: nums[i] + nums[j] };
        }),
      },
      { note: "large n=24000, pair at the end", args: parityCase(rng, 24000, -99998, 99998, 23999, 23998) },
      { note: "large n=15000, pair at both ends", args: parityCase(rng, 15000, -B + 4000, B - 4000, 14999, 0) },
    ];
  },

  validate({ nums, target }) {
    if (nums.length < 2 || nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < -B || v > B)) throw new Error("value out of range");
    if (target < -B || target > B) throw new Error("target out of range");
    const c = pairCount(nums, target);
    if (c !== 1) throw new Error(`expected exactly one answer, found ${c}`);
  },
};
