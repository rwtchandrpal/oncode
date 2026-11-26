const T = require("./_trees");

module.exports = {
  samples: [{ root: [8, 3, 10, 1, 6, null, 14] }, { root: [] }, { root: [1, null, 2, 3] }],

  hidden(rng) {
    const v = () => rng.int(-1000, 1000);
    return [
      { note: "single node", args: { root: [-1000] } },
      { note: "complete tree of 15", args: { root: T.toLevel(T.complete(15, v)) } },
      { note: "random shape, 100 nodes", args: { root: T.toLevel(T.randomShape(rng, 100, v)) } },
      { note: "random shape, 2000 nodes", args: { root: T.toLevel(T.randomShape(rng, 2000, v)) } },
      { note: "complete tree of 2000", args: { root: T.toLevel(T.complete(2000, v)) } },
      { note: "left chain of 2000", args: { root: T.toLevel(T.chain(2000, v, "left")) } },
      { note: "zigzag shape", args: { root: [1, 2, 3, null, 4, 5, null, 6, null, null, 7] } },
    ];
  },

  validate({ root }) {
    if (T.countNodes(root) > 2000) throw new Error("too many nodes");
    T.checkTreeValues(root, -1000, 1000);
  },
};
