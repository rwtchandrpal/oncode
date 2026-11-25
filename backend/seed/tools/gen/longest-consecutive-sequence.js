const B = 1e9;

module.exports = {
  samples: [{ nums: [10, 4, 20, 1, 3, 2] }, { nums: [7, -1, 0, 1, 5, 6] }, { nums: [] }],

  hidden(rng) {
    // a run of 20000 consecutive values plus scattered noise, all shuffled
    const start = rng.int(-90000, 60000);
    const run = rng.array(20000, (i) => start + i);
    const noise = rng.array(5000, () => rng.int(-99999, 99999));
    return [
      { note: "single element", args: { nums: [5] } },
      { note: "duplicates inside the run", args: { nums: [1, 2, 2, 3, 3, 3] } },
      { note: "min and max values", args: { nums: [-B, B, B - 1, -B + 1] } },
      { note: "n=1000 random", args: { nums: rng.array(1000, () => rng.int(-1500, 1500)) } },
      { note: "large n=25000, run of 20000", args: { nums: rng.shuffle([...run, ...noise]) } },
      { note: "large n=15000, sparse values", args: { nums: rng.array(15000, () => rng.int(-B, B)) } },
      { note: "large n=50000, all equal", args: { nums: rng.array(50000, () => 7) } },
    ];
  },

  validate({ nums }) {
    if (nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < -B || v > B)) throw new Error("value out of range");
  },
};
