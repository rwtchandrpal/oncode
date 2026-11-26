const T = require("./_trees");

module.exports = {
  samples: [{ root: [2, -1, 3] }, { root: [-3] }, { root: [-5, 4, 8, null, null, -2, 6] }],

  hidden(rng) {
    const v = () => rng.int(-1000, 1000);
    return [
      { note: "all negative, 1000 nodes", args: { root: T.toLevel(T.randomShape(rng, 1000, () => rng.int(-1000, -1))) } },
      { note: "all positive, complete 2000", args: { root: T.toLevel(T.complete(2000, () => rng.int(0, 1000))) } },
      { note: "random shape, 15000 nodes", args: { root: T.toLevel(T.randomShape(rng, 15000, v)) } },
      { note: "complete tree, 30000 nodes", args: { root: T.toLevel(T.complete(30000, v)) } },
      { note: "left chain of 5000", args: { root: T.toLevel(T.chain(5000, v, "left")) } },
      { note: "two long arms through a negative root", args: { root: T.toLevel(T.node(-1000, T.chain(3000, () => 1000, "left"), T.chain(3000, () => 1000, "right"))) } },
      { note: "best path avoids the root", args: { root: [-1000, 1000, -1000, 999, 998] } },
    ];
  },

  validate({ root }) {
    const n = T.countNodes(root);
    if (n < 1 || n > 3e4) throw new Error("size out of range");
    T.checkTreeValues(root, -1000, 1000);
  },
};
