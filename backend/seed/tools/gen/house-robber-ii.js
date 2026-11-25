module.exports = {
  samples: [{ nums: [3, 5, 3] }, { nums: [4, 1, 2, 7] }, { nums: [6] }],

  hidden(rng) {
    return [
      { note: "single empty house", args: { nums: [0] } },
      { note: "two houses", args: { nums: [1, 2] } },
      { note: "rich houses at both ends", args: { nums: [1000, 1, 1000] } },
      { note: "first and last are the best pair", args: { nums: [9, 1, 1, 1, 9] } },
      { note: "n=100 random", args: { nums: rng.array(100, () => rng.int(0, 1000)) } },
      { note: "n=100 all 1000", args: { nums: rng.array(100, () => 1000) } },
      { note: "n=99 random (odd circle)", args: { nums: rng.array(99, () => rng.int(0, 1000)) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 100) throw new Error("length out of range");
    if (nums.some((v) => v < 0 || v > 1000)) throw new Error("value out of range");
  },
};
