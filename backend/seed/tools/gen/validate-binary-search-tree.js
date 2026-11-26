const T = require("./_trees");

const MIN = -2147483648;
const MAX = 2147483647;

module.exports = {
  samples: [{ root: [5, 3, 8] }, { root: [5, 3, 8, 1, 6] }, { root: [7, 7] }],

  hidden(rng) {
    const sorted = rng.distinct(10000, -1e9, 1e9).sort((a, b) => a - b);
    const balanced = T.balancedBst(sorted);
    const broken = T.balancedBst(sorted);
    // swap two values deep in the tree: the in-order sequence is no longer increasing
    const all = T.nodes(broken);
    const deep = all.filter((n) => !n.left && !n.right);
    const a = deep[100], b = deep[3000];
    [a.val, b.val] = [b.val, a.val];
    return [
      { note: "single node at int max", args: { root: [MAX] } },
      { note: "int min root with int max right child", args: { root: [MIN, null, MAX] } },
      { note: "int max twice", args: { root: [MAX, MAX] } },
      { note: "balanced BST of 10000", args: { root: T.toLevel(balanced) } },
      { note: "balanced 10000 with two leaves swapped", args: { root: T.toLevel(broken) } },
      { note: "right chain of 5000, increasing", args: { root: T.toLevel(T.chain(5000, (i) => i * 3 - 7000, "right")) } },
      { note: "random tree, not a BST", args: { root: T.toLevel(T.randomShape(rng, 3000, () => rng.int(-1000, 1000))) } },
    ];
  },

  validate({ root }) {
    const n = T.countNodes(root);
    if (n < 1 || n > 1e4) throw new Error("size out of range");
  },
};
