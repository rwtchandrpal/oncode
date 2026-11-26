const T = require("./_trees");

module.exports = {
  samples: [{ root: [5, 3, 8, 1, 4, 7, 9] }, { root: [] }, { root: [2, null, 6] }],

  hidden(rng) {
    const v = () => rng.int(-100, 100);
    return [
      { note: "single node", args: { root: [1] } },
      { note: "left chain of 5", args: { root: T.toLevel(T.chain(5, v, "left")) } },
      { note: "complete tree of 15", args: { root: T.toLevel(T.complete(15, v)) } },
      { note: "random shape, 30 nodes", args: { root: T.toLevel(T.randomShape(rng, 30, v)) } },
      { note: "random shape, 100 nodes", args: { root: T.toLevel(T.randomShape(rng, 100, v)) } },
      { note: "right chain of 100", args: { root: T.toLevel(T.chain(100, v, "right")) } },
      { note: "duplicate values", args: { root: T.toLevel(T.randomShape(rng, 40, () => rng.int(0, 2))) } },
    ];
  },

  validate({ root }) {
    if (T.countNodes(root) > 100) throw new Error("too many nodes");
    T.checkTreeValues(root, -100, 100);
  },
};
