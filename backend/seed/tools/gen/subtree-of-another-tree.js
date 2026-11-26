const T = require("./_trees");

// Deep copy of a subtree.
const copy = (n) => (n ? T.node(n.val, copy(n.left), copy(n.right)) : null);

module.exports = {
  samples: [
    { root: [3, 4, 5, 1, 2], subRoot: [4, 1, 2] },
    { root: [3, 4, 5, 1, 2, null, null, null, null, 0], subRoot: [4, 1, 2] },
    { root: [7], subRoot: [7] },
  ],

  hidden(rng) {
    const small = () => rng.int(0, 3);
    const big = T.randomShape(rng, 2000, small);
    const all = T.nodes(big);
    const target = all.find((n) => T.nodes(n).length > 20 && T.nodes(n).length < 200) || all[1];
    const sub = copy(target);
    const almost = copy(target);
    T.nodes(almost).find((n) => !n.left && !n.right).left = T.node(9); // differs only at the very bottom
    // chain of equal values: many partial matches
    const chainRoot = T.chain(2000, () => 1, "left");
    return [
      { note: "different single nodes", args: { root: [1], subRoot: [2] } },
      { note: "subRoot larger than root", args: { root: [1, 1], subRoot: [1, 1, 1] } },
      { note: "2000 nodes, subtree present", args: { root: T.toLevel(big), subRoot: T.toLevel(sub) } },
      { note: "2000 nodes, differs only at a leaf", args: { root: T.toLevel(big), subRoot: T.toLevel(almost) } },
      { note: "chain of 2000 ones, sub chain of 1000 present", args: { root: T.toLevel(chainRoot), subRoot: T.toLevel(T.chain(1000, () => 1, "left")) } },
      { note: "chain of 2000 ones, sub chain bends right at the end", args: { root: T.toLevel(chainRoot), subRoot: T.toLevel(T.node(1, T.chain(998, () => 1, "left"), T.node(1))) } },
      { note: "match only at the root's left child", args: { root: [1, 2, 3, 4, 5], subRoot: [2, 4, 5] } },
    ];
  },

  validate({ root, subRoot }) {
    const a = T.countNodes(root), b = T.countNodes(subRoot);
    if (a < 1 || a > 2000) throw new Error("root size out of range");
    if (b < 1 || b > 1000) throw new Error("subRoot size out of range");
    T.checkTreeValues(root, -1e4, 1e4);
    T.checkTreeValues(subRoot, -1e4, 1e4);
  },
};
