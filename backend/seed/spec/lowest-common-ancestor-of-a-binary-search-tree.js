module.exports = {
  slug: "lowest-common-ancestor-of-a-binary-search-tree",
  signature: {
    method: "lowestCommonAncestor",
    params: [
      { name: "root", type: "TreeNode" },
      { name: "p", type: "TreeNodeRef", of: "root" },
      { name: "q", type: "TreeNodeRef", of: "root" },
    ],
    returns: "TreeNodeRef",
  },
  description: `
You are given the \`root\` of a **binary search tree** (every value in a node's left subtree is smaller than the node's value, and every value in its right subtree is larger) and two different nodes \`p\` and \`q\` of that tree.

Return their **lowest common ancestor**: the deepest node that has both \`p\` and \`q\` in its subtree. A node counts as part of its own subtree, so if \`q\` lies under \`p\`, the answer is \`p\`.

**Input and output format:** the tree is given in level order; \`p\` and \`q\` are given by their values (all values are unique) and passed to your method as the matching nodes. The judge prints the value of the node you return.
`,
  constraints: [
    "The number of nodes is between 2 and 10^5",
    "-10^9 <= Node.val <= 10^9",
    "All values are unique",
    "p != q, and both are nodes of the tree",
  ],
  examples: [
    { explanation: "2 is in 6's left subtree and 9 in its right subtree, so 6 is the deepest common ancestor." },
    { explanation: "4 lies below 2, and a node is an ancestor of itself, so the answer is 2." },
    { explanation: "In a two-node tree the root is the ancestor of both." },
  ],
  notes: "p and q are read as values and looked up in the tree by the driver; the returned node is printed as its value.",
};
