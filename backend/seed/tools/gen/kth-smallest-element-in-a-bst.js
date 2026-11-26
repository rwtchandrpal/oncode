const T = require("./_trees");

module.exports = {
  samples: [
    { root: [5, 3, 7, 2, 4, 6, 8], k: 3 },
    { root: [1], k: 1 },
    { root: [4, 2, null, 1, 3], k: 4 },
  ],

  hidden(rng) {
    const sorted = rng.distinct(10000, 0, 10000).sort((a, b) => a - b);
    const balanced = T.toLevel(T.balancedBst(sorted));
    const random = T.toLevel(T.bstInsert(rng.shuffle(rng.distinct(8000, 0, 10000))));
    const leftChain = T.toLevel(T.bstInsert(rng.distinct(3000, 0, 10000).sort((a, b) => b - a)));
    return [
      { note: "two nodes, k=2", args: { root: [0, null, 10000], k: 2 } },
      { note: "balanced 10000, k=1", args: { root: balanced, k: 1 } },
      { note: "balanced 10000, k=n", args: { root: balanced, k: 10000 } },
      { note: "balanced 10000, k=5000", args: { root: balanced, k: 5000 } },
      { note: "random BST 8000, random k", args: { root: random, k: rng.int(1, 8000) } },
      { note: "left chain of 3000, k=1 (deepest node)", args: { root: leftChain, k: 1 } },
      { note: "left chain of 3000, k=3000 (root)", args: { root: leftChain, k: 3000 } },
    ];
  },

  validate({ root, k }) {
    const tree = T.fromLevel(root);
    const vals = T.inorder(tree);
    if (vals.length < 1 || vals.length > 1e4) throw new Error("size out of range");
    for (let i = 1; i < vals.length; i++) if (vals[i] <= vals[i - 1]) throw new Error("not a BST with unique values");
    T.checkTreeValues(root, 0, 1e4);
    if (k < 1 || k > vals.length) throw new Error("k out of range");
  },
};
