module.exports = {
  slug: "binary-tree-level-order-traversal",
  signature: { method: "levelOrder", params: [{ name: "root", type: "TreeNode" }], returns: "List<List<int>>" },
  description: `
Given the \`root\` of a binary tree, return the values of its nodes **level by level**: first the root's level, then its children's level, and so on. Within each level, list the values from **left to right**.

Return a list of levels, where each level is a list of values. An empty tree gives an empty list.
`,
  constraints: ["The number of nodes is between 0 and 2000", "-1000 <= Node.val <= 1000"],
  examples: [
    { explanation: "Level 0 holds 8, level 1 holds 3 and 10, level 2 holds 1, 6 and 14." },
    { explanation: "An empty tree has no levels." },
    { explanation: "Each level of this chain has a single node." },
  ],
};
