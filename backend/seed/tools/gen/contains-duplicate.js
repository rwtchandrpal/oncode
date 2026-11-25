const B = 1e9;

module.exports = {
  samples: [{ nums: [3, 1, 4, 1, 5] }, { nums: [2, 7, -1, 8] }, { nums: [-6, -6] }],

  hidden(rng) {
    const distinctLarge = rng.distinct(25000, -99999, 99999);
    const withDupAtEnd = rng.distinct(25000, -99999, 99999);
    withDupAtEnd[withDupAtEnd.length - 1] = withDupAtEnd[0];
    const farApart = rng.distinct(1000, -B, B);
    farApart[farApart.length - 1] = farApart[0];
    return [
      { note: "single element", args: { nums: [7] } },
      { note: "min and max values, distinct", args: { nums: [-B, B] } },
      { note: "max value repeated", args: { nums: [B, -B, B] } },
      { note: "n=1000, only first and last equal", args: { nums: farApart } },
      { note: "n=2000, tiny value range", args: { nums: rng.array(2000, () => rng.int(-5, 5)) } },
      { note: "large n=25000, all distinct", args: { nums: distinctLarge } },
      { note: "large n=25000, last equals first", args: { nums: withDupAtEnd } },
    ];
  },

  validate({ nums }) {
    if (nums.length < 1 || nums.length > 1e5) throw new Error("length out of range");
    if (nums.some((v) => v < -B || v > B)) throw new Error("value out of range");
  },
};
