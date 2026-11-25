const B = 1e4;

const frequencies = (nums) => {
  const f = new Map();
  for (const v of nums) f.set(v, (f.get(v) || 0) + 1);
  return [...f.values()].sort((a, b) => b - a);
};

// `m` distinct values; the top k get frequencies strictly above all others.
const build = (rng, m, k, topFreq, restFreq) => {
  const values = rng.distinct(m, -B, B);
  const nums = [];
  values.forEach((v, i) => {
    const f = i < k ? rng.int(topFreq[0], topFreq[1]) : rng.int(restFreq[0], restFreq[1]);
    for (let j = 0; j < f; j++) nums.push(v);
  });
  return rng.shuffle(nums);
};

module.exports = {
  samples: [
    { nums: [4, 4, 4, 6, 6, 9, 1], k: 2 },
    { nums: [7], k: 1 },
    { nums: [5, -2, 5, -2, 3, 5], k: 2 },
  ],

  hidden(rng) {
    return [
      { note: "k equals the number of distinct values", args: { nums: [1, 2, 2, 3, 3, 3], k: 3 } },
      { note: "min and max values", args: { nums: [-B, -B, B], k: 1 } },
      { note: "n~1000, k=5", args: { nums: build(rng, 200, 5, [20, 30], [1, 10]), k: 5 } },
      { note: "n~5000, k=1", args: { nums: build(rng, 2000, 1, [50, 50], [1, 3]), k: 1 } },
      { note: "large n~30000, k=100", args: { nums: build(rng, 3000, 100, [40, 60], [1, 6]), k: 100 } },
      { note: "large n~25000, k=2000 of 2500", args: { nums: build(rng, 2500, 2000, [11, 12], [1, 10]), k: 2000 } },
      { note: "large n=30000, one value dominates", args: { nums: build(rng, 10000, 1, [20000, 20000], [1, 1]), k: 1 } },
    ];
  },

  validate({ nums, k }) {
    if (nums.length < 1 || nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < -B || v > B)) throw new Error("value out of range");
    const f = frequencies(nums);
    if (k < 1 || k > f.length) throw new Error("k out of range");
    if (k < f.length && f[k - 1] === f[k]) throw new Error("answer is not unique (tie at the k-th frequency)");
  },
};
