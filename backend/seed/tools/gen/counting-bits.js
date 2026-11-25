module.exports = {
  samples: [{ n: 2 }, { n: 5 }, { n: 0 }],

  hidden() {
    return [
      { note: "n=1", args: { n: 1 } },
      { note: "n=8 (power of two)", args: { n: 8 } },
      { note: "n=31 (all ones)", args: { n: 31 } },
      { note: "n=1024", args: { n: 1024 } },
      { note: "n=4097", args: { n: 4097 } },
      { note: "n=65535", args: { n: 65535 } },
      { note: "large n=80000 (output ~180 KB)", args: { n: 80000 } },
    ];
  },

  validate({ n }) {
    if (n < 0 || n > 1e5) throw new Error("n out of range");
  },
};
