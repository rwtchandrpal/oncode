const B = 1e6;

const rotated = (rng, n, k) => {
  const sorted = rng.distinct(n, -B, B).sort((a, b) => a - b);
  return [...sorted.slice(k), ...sorted.slice(0, k)];
};

const isRotatedSorted = (nums) => {
  let drops = 0;
  for (let i = 0; i < nums.length; i++) if (nums[i] > nums[(i + 1) % nums.length]) drops++;
  return nums.length === 1 || drops === 1;
};

module.exports = {
  samples: [{ nums: [5, 8, 9, 1, 3] }, { nums: [2, 4, 6, 8] }, { nums: [7, -2] }],

  hidden(rng) {
    return [
      { note: "single element", args: { nums: [42] } },
      { note: "two elements, rotated", args: { nums: [2, 1] } },
      { note: "two elements, sorted", args: { nums: [1, 2] } },
      { note: "n=1000 rotated by 1", args: { nums: rotated(rng, 1000, 1) } },
      { note: "n=1000 rotated by n-1", args: { nums: rotated(rng, 1000, 999) } },
      { note: "large n=20000, rotated near the end", args: { nums: rotated(rng, 20000, 19990) } },
      { note: "large n=20000, rotated in the middle", args: { nums: rotated(rng, 20000, rng.int(5000, 15000)) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < -B || v > B)) throw new Error("value out of range");
    if (new Set(nums).size !== nums.length) throw new Error("values not distinct");
    if (!isRotatedSorted(nums)) throw new Error("not a rotated sorted array");
  },

  rotated,
  isRotatedSorted,
};
