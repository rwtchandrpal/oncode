const LIMIT = 2147483647;

// Values that keep every zero-free stretch's absolute product small: mostly +-1, a few bigger
// factors, and zeros that split the array.
const mixed = (rng, n, factorRate, zeroRate) =>
  rng.array(n, () => {
    const r = rng.next();
    if (r < zeroRate) return 0;
    if (r < zeroRate + factorRate) return rng.pick([2, -2, 3, -3, 5, -7, 10, -10]);
    return rng.pick([1, -1]);
  });

const fits = (nums) => {
  let p = 1;
  for (const v of nums) {
    if (v === 0) { p = 1; continue; }
    p *= Math.abs(v);
    if (p > LIMIT) return false;
  }
  return true;
};

const until = (make) => {
  for (;;) {
    const nums = make();
    if (fits(nums)) return nums;
  }
};

module.exports = {
  samples: [{ nums: [-2, 3, -4] }, { nums: [0, -3, -1, 0, 2] }, { nums: [-5] }],

  hidden(rng) {
    return [
      { note: "single zero", args: { nums: [0] } },
      { note: "negatives split by zero", args: { nums: [-2, 0, -1] } },
      { note: "odd number of negatives", args: { nums: [-1, -2, -3, 4] } },
      { note: "n=1000 mixed", args: { nums: until(() => mixed(rng, 1000, 0.02, 0.01)) } },
      { note: "large n=20000, no zeros, few factors", args: { nums: until(() => mixed(rng, 20000, 0.0004, 0)) } },
      { note: "large n=20000 with zeros", args: { nums: until(() => mixed(rng, 20000, 0.01, 0.005)) } },
      { note: "n=30 of -2 and 2", args: { nums: rng.array(30, () => rng.pick([2, -2])) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 2e4) throw new Error("length out of range");
    if (nums.some((v) => v < -10 || v > 10)) throw new Error("value out of range");
    if (!fits(nums)) throw new Error("some subarray product overflows 32 bits");
  },
};
