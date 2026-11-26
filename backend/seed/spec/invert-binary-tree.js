module.exports = {
  slug: "invert-binary-tree",
  signature: { method: "invertTree", params: [{ name: "root", type: "TreeNode" }], returns: "TreeNode" },
  description: `
Given the \`root\` of a binary tree, **invert** it: swap the left and right child of every node, so the tree becomes its own mirror image. Return the root.

Trees are written in level order (row by row, left to right), with \`null\` marking a missing child; \`[]\` is the empty tree.
`,
  constraints: ["The number of nodes is between 0 and 100", "-100 <= Node.val <= 100"],
  examples: [
    { explanation: "Every node's children swap sides, at every level." },
    { explanation: "An empty tree stays empty." },
    { explanation: "The single right child becomes a left child." },
  ],
};
