module.exports = {
  samples: [
    { head: [4, 7, 1, 8], n: 1 },
    { head: [6], n: 1 },
    { head: [3, 5], n: 2 },
  ],

  hidden(rng) {
    const list30 = rng.array(30, () => rng.int(0, 100));
    return [
      { note: "two nodes, remove the last", args: { head: [1, 2], n: 1 } },
      { note: "30 nodes, remove the head", args: { head: list30, n: 30 } },
      { note: "30 nodes, remove the tail", args: { head: list30, n: 1 } },
      { note: "30 nodes, remove the middle", args: { head: list30, n: 15 } },
      { note: "30 nodes, remove the second", args: { head: list30, n: 29 } },
      { note: "duplicate values", args: { head: [5, 5, 5, 5], n: 2 } },
      { note: "random length and n", args: (() => { const h = rng.array(rng.int(3, 30), () => rng.int(0, 100)); return { head: h, n: rng.int(1, h.length) }; })() },
    ];
  },

  validate({ head, n }) {
    if (head.length < 1 || head.length > 30) throw new Error("size out of range");
    if (head.some((v) => v < 0 || v > 100)) throw new Error("value out of range");
    if (n < 1 || n > head.length) throw new Error("n out of range");
  },
};
