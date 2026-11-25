const MAX = 2147483647;

module.exports = {
  samples: [{ n: 11 }, { n: 128 }, { n: 2147483645 }],

  hidden(rng) {
    return [
      { note: "n=1 (minimum)", args: { n: 1 } },
      { note: "n=2^31-1 (all 31 bits set)", args: { n: MAX } },
      { note: "n=2^30 (highest bit only)", args: { n: 1073741824 } },
      { note: "alternating bits 0x55555555", args: { n: 1431655765 } },
      { note: "n=255", args: { n: 255 } },
      { note: "random large", args: { n: rng.int(1 << 30, MAX) } },
      { note: "random", args: { n: rng.int(1, MAX) } },
    ];
  },

  validate({ n }) {
    if (n < 1 || n > MAX) throw new Error("n out of range");
  },
};
