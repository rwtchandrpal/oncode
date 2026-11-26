module.exports = {
  samples: [{ head: [10, 20, 30, 40, 50] }, { head: [1, 2] }, { head: [9] }],

  hidden(rng) {
    return [
      { note: "three nodes", args: { head: [1, 2, 3] } },
      { note: "four nodes", args: { head: [4, 3, 2, 1] } },
      { note: "n=101 counting", args: { head: rng.array(101, (i) => i + 1) } },
      { note: "n=1000 random", args: { head: rng.array(1000, () => rng.int(1, 1000)) } },
      { note: "large n=40000 random (even)", args: { head: rng.array(40000, () => rng.int(1, 1000)) } },
      { note: "large n=39999 random (odd)", args: { head: rng.array(39999, () => rng.int(1, 1000)) } },
      { note: "n=5000 all equal", args: { head: rng.array(5000, () => 1000) } },
    ];
  },

  validate({ head }) {
    if (head.length < 1 || head.length > 5e4) throw new Error("node count out of range");
    if (head.some((v) => v < 1 || v > 1000)) throw new Error("value out of range");
  },
};
