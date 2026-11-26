module.exports = {
  slug: "maximum-depth-of-binary-tree",
  signature: { method: "maxDepth", params: [{ name: "root", type: "TreeNode" }], returns: "int" },
  description: `
The **depth** of a binary tree is the number of nodes on the longest path from the root down to a leaf (a node with no children).

Given the \`root\` of a binary tree, return its depth. An empty tree has depth \`0\`.

Trees are written in level order with \`null\` for missing children.
`,
  constraints: ["The number of nodes is between 0 and 10^4", "-100 <= Node.val <= 100"],
  examples: [
    { explanation: "The longest path is 4 -> 9 -> 2 -> 7, four nodes." },
    { explanation: "An empty tree." },
    { explanation: "Root and one right child." },
  ],
};
