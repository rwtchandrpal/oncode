const { rotated, isRotatedSorted } = require("./find-minimum-in-rotated-sorted-array");

const B = 1e6;

const absentValue = (rng, nums) => {
  const set = new Set(nums);
  for (;;) {
    const v = rng.int(-B, B);
    if (!set.has(v)) return v;
  }
};

module.exports = {
  samples: [
    { nums: [5, 8, 9, 1, 3], target: 9 },
    { nums: [5, 8, 9, 1, 3], target: 4 },
    { nums: [6], target: 6 },
  ],

  hidden(rng) {
    const a = rotated(rng, 1000, rng.int(1, 999));
    const b = rotated(rng, 1000, rng.int(1, 999));
    const c = rotated(rng, 20000, 7000);
    const d = rotated(rng, 20000, 13000);
    const e = rotated(rng, 20000, 19999);
    return [
      { note: "single element, absent", args: { nums: [6], target: 1 } },
      { note: "two elements, target second", args: { nums: [3, 1], target: 1 } },
      { note: "n=1000, present", args: { nums: a, target: a[rng.int(0, 999)] } },
      { note: "n=1000, absent", args: { nums: b, target: absentValue(rng, b) } },
      { note: "large n=20000, target is the minimum", args: { nums: c, target: Math.min(...c) } },
      { note: "large n=20000, target just left of the drop", args: { nums: d, target: Math.max(...d) } },
      { note: "large n=20000, absent", args: { nums: e, target: absentValue(rng, e) } },
    ];
  },

  validate({ nums, target }) {
    if (nums.length < 1 || nums.length > 1e5) throw new Error("length out of range");
    if ([...nums, target].some((v) => v < -B || v > B)) throw new Error("value out of range");
    if (new Set(nums).size !== nums.length) throw new Error("values not distinct");
    if (!isRotatedSorted(nums)) throw new Error("not a rotated sorted array");
  },
};
