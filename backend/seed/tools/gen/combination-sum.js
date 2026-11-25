// Number of multisets of candidates summing to target (coin-change "ways").
const ways = (candidates, target) => {
  const w = Array(target + 1).fill(0);
  w[0] = 1;
  for (const c of candidates) for (let a = c; a <= target; a++) w[a] += w[a - c];
  return w[target];
};

const randomCase = (rng, count, target) => {
  for (;;) {
    const candidates = rng.distinct(count, 2, 40);
    if (ways(candidates, target) < 150) return { candidates, target };
  }
};

module.exports = {
  samples: [
    { candidates: [2, 3, 5], target: 8 },
    { candidates: [2], target: 1 },
    { candidates: [4, 6, 9], target: 13 },
  ],

  hidden(rng) {
    return [
      { note: "only 2s, target 40", args: { candidates: [2], target: 40 } },
      { note: "candidate equals target", args: { candidates: [40, 39, 38], target: 40 } },
      { note: "all candidates too large", args: { candidates: [25, 30, 35], target: 20 } },
      { note: "2,3,5,7 to 20", args: { candidates: [7, 5, 3, 2], target: 20 } },
      { note: "8 random candidates, target 30", args: randomCase(rng, 8, 30) },
      { note: "30 candidates, target 25", args: randomCase(rng, 30, 25) },
      { note: "large candidates only, target 40", args: { candidates: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30], target: 40 } },
    ];
  },

  validate({ candidates, target }) {
    if (candidates.length < 1 || candidates.length > 30) throw new Error("candidate count out of range");
    if (candidates.some((c) => c < 2 || c > 40)) throw new Error("candidate out of range");
    if (new Set(candidates).size !== candidates.length) throw new Error("candidates not distinct");
    if (target < 1 || target > 40) throw new Error("target out of range");
    if (ways(candidates, target) >= 150) throw new Error("150 or more combinations");
  },
};
