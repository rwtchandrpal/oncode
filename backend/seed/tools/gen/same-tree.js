const T = require("./_trees");

module.exports = {
  samples: [
    { p: [6, 2, 8], q: [6, 2, 8] },
    { p: [1, 2], q: [1, null, 2] },
    { p: [3, 4, 5], q: [3, 5, 4] },
  ],

  hidden(rng) {
    const v = () => rng.int(-1e4, 1e4);
    const big = T.toLevel(T.randomShape(rng, 99, v)); // 99, so adding one leaf stays within 100
    const changedValue = big.slice();
    const lastIdx = changedValue.length - 1;
    changedValue[lastIdx] = changedValue[lastIdx] === 1 ? 2 : 1; // last node, different value
    const extraLeaf = T.fromLevel(big);
    const leaf = T.nodes(extraLeaf).find((n) => !n.left);
    leaf.left = T.node(0); // one extra node
    return [
      { note: "both empty", args: { p: [], q: [] } },
      { note: "one empty", args: { p: [0], q: [] } },
      { note: "same values, mirrored shape", args: { p: [1, 2, 2, 3, null, null, 3], q: [1, 2, 2, null, 3, 3] } },
      { note: "99 nodes identical", args: { p: big, q: big.slice() } },
      { note: "99 nodes, last value differs", args: { p: big, q: changedValue } },
      { note: "99 vs 100 nodes, one extra leaf", args: { p: big, q: T.toLevel(extraLeaf) } },
      { note: "same in-order values, different shape", args: { p: [2, 1], q: [1, null, 2] } },
    ];
  },

  validate({ p, q }) {
    for (const t of [p, q]) {
      if (T.countNodes(t) > 100) throw new Error("too many nodes");
      T.checkTreeValues(t, -1e4, 1e4);
    }
  },
};
