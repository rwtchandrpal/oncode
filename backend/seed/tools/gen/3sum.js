const B = 1e5;

module.exports = {
  samples: [{ nums: [-3, 1, 2, 0, 3, -2] }, { nums: [1, 2, 3] }, { nums: [0, 0, 0, 0] }],

  hidden(rng) {
    return [
      { note: "three values, no triplet", args: { nums: [1, -1, 1] } },
      { note: "uses a value twice", args: { nums: [-4, 2, 2, 2] } },
      { note: "extreme values", args: { nums: [-B, B, 0, -B, B, 0] } },
      { note: "n=300 small range, many triplets", args: { nums: rng.array(300, () => rng.int(-20, 20)) } },
      { note: "n=3000 range [-50, 50]", args: { nums: rng.array(3000, () => rng.int(-50, 50)) } },
      // mostly positive values keep the number of triplets (and the output) small while n stays 3000
      { note: "n=3000 wide range, 30 negatives", args: { nums: rng.shuffle([...rng.array(2970, () => rng.int(1, B)), ...rng.array(30, () => rng.int(-B, -1))]) } },
      { note: "n=3000 mostly zeros", args: { nums: rng.array(3000, () => (rng.next() < 0.9 ? 0 : rng.int(-3, 3))) } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 3 || nums.length > 3000) throw new Error("length out of range");
    if (nums.some((v) => v < -B || v > B)) throw new Error("value out of range");
  },
};
