const MAX = 4294967295;

module.exports = {
  samples: [{ n: 1 }, { n: 6 }, { n: 4294967293 }],

  hidden(rng) {
    return [
      { note: "zero", args: { n: 0 } },
      { note: "all ones", args: { n: MAX } },
      { note: "only the top bit", args: { n: 2147483648 } },
      { note: "0x0295A01C", args: { n: 43261596 } },
      { note: "random above 2^31", args: { n: rng.int(2147483648, MAX) } },
      { note: "random", args: { n: rng.int(0, MAX) } },
      { note: "random small", args: { n: rng.int(0, 65535) } },
    ];
  },

  validate({ n }) {
    if (n < 0 || n > MAX) throw new Error("n out of range");
  },
};
