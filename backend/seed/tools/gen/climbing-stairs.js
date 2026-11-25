module.exports = {
  samples: [{ n: 2 }, { n: 3 }, { n: 5 }],

  hidden() {
    return [
      { note: "n=1 (minimum)", args: { n: 1 } },
      { note: "n=4", args: { n: 4 } },
      { note: "n=10", args: { n: 10 } },
      { note: "n=20", args: { n: 20 } },
      { note: "n=35", args: { n: 35 } },
      { note: "n=44", args: { n: 44 } },
      { note: "n=45 (maximum, fits in int)", args: { n: 45 } },
    ];
  },

  validate({ n }) {
    if (n < 1 || n > 45) throw new Error("n out of range");
  },
};
