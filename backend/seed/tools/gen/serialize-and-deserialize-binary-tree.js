const T = require("./_trees");

module.exports = {
  samples: [{ root: [1, 2, 3, null, null, 4, 5] }, { root: [] }, { root: [-10, null, 20, -30] }],

  hidden(rng) {
    const v = () => rng.int(-1000, 1000);
    return [
      { note: "single node", args: { root: [1000] } },
      { note: "multi-digit negatives", args: { root: [-1000, -999, 1000, null, -1, 0] } },
      { note: "random shape, 500 nodes", args: { root: T.toLevel(T.randomShape(rng, 500, v)) } },
      { note: "random shape, 10000 nodes", args: { root: T.toLevel(T.randomShape(rng, 10000, v)) } },
      { note: "complete tree of 10000", args: { root: T.toLevel(T.complete(10000, v)) } },
      { note: "left chain of 5000", args: { root: T.toLevel(T.chain(5000, v, "left")) } },
      { note: "right chain of 5000, all equal", args: { root: T.toLevel(T.chain(5000, () => 7, "right")) } },
    ];
  },

  validate({ root }) {
    if (T.countNodes(root) > 1e4) throw new Error("too many nodes");
    T.checkTreeValues(root, -1000, 1000);
  },
};
