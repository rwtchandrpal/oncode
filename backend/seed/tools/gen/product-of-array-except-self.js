const LIMIT = 2147483647;

// Mostly 1 and -1, plus a few larger factors placed at random, so all prefix/suffix products stay small.
const mostlyOnes = (rng, n, extras) => {
  const a = rng.array(n, () => rng.pick([1, -1]));
  for (const v of extras) a[rng.int(0, n - 1)] = v;
  return a;
};

module.exports = {
  samples: [{ nums: [2, 3, 4, 5] }, { nums: [-2, 0, 5, 1] }, { nums: [3, -1] }],

  hidden(rng) {
    return [
      { note: "two zeros", args: { nums: [0, 0] } },
      { note: "two zeros among values", args: { nums: [5, 0, 3, 0] } },
      { note: "min and max values", args: { nums: [-30, 30, -30, 30] } },
      { note: "n=1000, +-1 and a few factors", args: { nums: mostlyOnes(rng, 1000, [2, -3, 5, -7, 30]) } },
      { note: "n=30, many factors of 2", args: { nums: rng.array(30, () => rng.pick([2, -2, 1])) } },
      // few, small factors keep each answer short (the output must stay under 200 KB too)
      { note: "large n=40000, +-1 and factors 2, -3", args: { nums: mostlyOnes(rng, 40000, [2, -3]) } },
      { note: "large n=50000, one zero", args: { nums: mostlyOnes(rng, 50000, [0, 3, -4, 6]) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 2 || nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < -30 || v > 30)) throw new Error("value out of range");
    for (const order of [nums, nums.slice().reverse()]) {
      let p = 1;
      for (const v of order) {
        p *= v;
        if (Math.abs(p) > LIMIT) throw new Error("a prefix or suffix product overflows 32 bits");
      }
    }
  },
};
