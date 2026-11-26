const T = require("./_trees");

// Tree of n nodes with unique values from [-3000, 3000], shaped by `shape(valFn)`.
const traversals = (rng, n, shape) => {
  const vals = rng.distinct(n, -3000, 3000);
  const root = shape((i) => vals[i]);
  return { preorder: T.preorder(root), inorder: T.inorder(root) };
};

module.exports = {
  samples: [
    { preorder: [1, 2, 4, 3, 5], inorder: [4, 2, 1, 5, 3] },
    { preorder: [-1], inorder: [-1] },
    { preorder: [1, 2, 3], inorder: [1, 2, 3] },
  ],

  hidden(rng) {
    return [
      { note: "two nodes, left child", args: { preorder: [7, 3], inorder: [3, 7] } },
      { note: "random shape, 100 nodes", args: traversals(rng, 100, (v) => T.randomShape(rng, 100, v)) },
      { note: "random shape, 3000 nodes", args: traversals(rng, 3000, (v) => T.randomShape(rng, 3000, v)) },
      { note: "complete tree, 3000 nodes", args: traversals(rng, 3000, (v) => T.complete(3000, v)) },
      { note: "left chain of 3000", args: traversals(rng, 3000, (v) => T.chain(3000, v, "left")) },
      { note: "right chain of 3000", args: traversals(rng, 3000, (v) => T.chain(3000, v, "right")) },
      { note: "zigzag of 1000", args: traversals(rng, 1000, (v) => { const r = T.node(v(0)); let c = r; for (let i = 1; i < 1000; i++) { const s = i % 2 ? "left" : "right"; c[s] = T.node(v(i)); c = c[s]; } return r; }) },
    ];
  },

  validate({ preorder, inorder }) {
    const n = preorder.length;
    if (n < 1 || n > 3000 || inorder.length !== n) throw new Error("length out of range");
    if (new Set(preorder).size !== n) throw new Error("values not unique");
    if ([...preorder].sort((a, b) => a - b).join() !== [...inorder].sort((a, b) => a - b).join()) throw new Error("different value sets");
    if (preorder.some((v) => v < -3000 || v > 3000)) throw new Error("value out of range");
  },
};
