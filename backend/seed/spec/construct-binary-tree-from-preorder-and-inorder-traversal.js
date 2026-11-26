module.exports = {
  slug: "construct-binary-tree-from-preorder-and-inorder-traversal",
  signature: {
    method: "buildTree",
    params: [
      { name: "preorder", type: "int[]" },
      { name: "inorder", type: "int[]" },
    ],
    returns: "TreeNode",
  },
  description: `
\`preorder\` lists the values of a binary tree in **preorder** (node, then left subtree, then right subtree), and \`inorder\` lists the same tree's values in **inorder** (left subtree, node, right subtree). All values are distinct.

Rebuild the tree and return its root. The judge prints the tree in level order with \`null\` for missing children.

Hint: the first value of \`preorder\` is the root, and its position in \`inorder\` splits the remaining values into the left and right subtrees.
`,
  constraints: [
    "1 <= preorder.length <= 3000",
    "inorder.length == preorder.length",
    "-3000 <= values <= 3000",
    "All values are unique",
    "preorder and inorder come from the same tree",
  ],
  examples: [
    { explanation: "Root 1; inorder puts 4, 2 to its left and 5, 3 to its right." },
    { explanation: "A single node." },
    { explanation: "Both orders are 1, 2, 3, which means each node is the right child of the previous one." },
  ],
};
