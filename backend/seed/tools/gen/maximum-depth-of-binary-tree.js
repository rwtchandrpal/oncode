const T = require("./_trees");

module.exports = {
  samples: [{ root: [4, 1, 9, null, null, 2, 3, 7] }, { root: [] }, { root: [1, null, 2] }],

  hidden(rng) {
    const v = () => rng.int(-100, 100);
    return [
      { note: "single node", args: { root: [0] } },
      { note: "complete tree of 1000", args: { root: T.toLevel(T.complete(1000, v)) } },
      { note: "random shape, 2000 nodes", args: { root: T.toLevel(T.randomShape(rng, 2000, v)) } },
      { note: "random shape, 10000 nodes", args: { root: T.toLevel(T.randomShape(rng, 10000, v)) } },
      { note: "left chain of 3000", args: { root: T.toLevel(T.chain(3000, v, "left")) } },
      { note: "right chain of 5000", args: { root: T.toLevel(T.chain(5000, v, "right")) } },
      { note: "deep branch on one side", args: { root: T.toLevel(T.node(1, T.complete(31, v), T.chain(40, v, "left"))) } },
    ];
  },

  validate({ root }) {
    if (T.countNodes(root) > 1e4) throw new Error("too many nodes");
    T.checkTreeValues(root, -100, 100);
  },
};
