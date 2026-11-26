const T = require("./_trees");

const B = 1e9;

const isBst = (root) => {
  const vals = T.inorder(root);
  for (let i = 1; i < vals.length; i++) if (vals[i] <= vals[i - 1]) return false;
  return true;
};

module.exports = {
  samples: [
    { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 9 },
    { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 4 },
    { root: [2, 1], p: 2, q: 1 },
  ],

  hidden(rng) {
    const sortedVals = rng.distinct(15000, -B, B).sort((a, b) => a - b);
    const balanced = T.balancedBst(sortedVals);
    const random = T.bstInsert(rng.shuffle(rng.distinct(10000, -B, B)));
    const randomVals = T.inorder(random);
    const chainVals = rng.distinct(5000, -100000, 100000).sort((a, b) => a - b);
    const chain = T.bstInsert(chainVals); // ascending inserts: a right-leaning chain
    return [
      { note: "two nodes, q is the root", args: { root: [-B, null, B], p: B, q: -B } },
      { note: "balanced 15000, extremes", args: { root: T.toLevel(balanced), p: sortedVals[0], q: sortedVals[14999] } },
      { note: "balanced 15000, neighbours", args: { root: T.toLevel(balanced), p: sortedVals[7001], q: sortedVals[7002] } },
      { note: "random BST 10000, random pair", args: { root: T.toLevel(random), p: randomVals[rng.int(0, 4999)], q: randomVals[rng.int(5000, 9999)] } },
      { note: "random BST 10000, q below p", args: { root: T.toLevel(random), p: T.nodes(random)[200].val, q: T.nodes(random)[200].left ? T.nodes(random)[200].left.val : T.nodes(random)[201].val } },
      { note: "right chain of 5000, deep pair", args: { root: T.toLevel(chain), p: chainVals[4998], q: chainVals[4999] } },
      { note: "right chain of 5000, root and leaf", args: { root: T.toLevel(chain), p: chainVals[4999], q: chainVals[0] } },
    ];
  },

  validate({ root, p, q }) {
    const n = T.countNodes(root);
    if (n < 2 || n > 1e5) throw new Error("size out of range");
    T.checkTreeValues(root, -B, B);
    const tree = T.fromLevel(root);
    if (!isBst(tree)) throw new Error("not a BST with unique values");
    const vals = new Set(T.inorder(tree));
    if (p === q || !vals.has(p) || !vals.has(q)) throw new Error("p and q must be two different nodes of the tree");
  },
};
