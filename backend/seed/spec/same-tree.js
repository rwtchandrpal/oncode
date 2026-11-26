module.exports = {
  slug: "same-tree",
  signature: {
    method: "isSameTree",
    params: [
      { name: "p", type: "TreeNode" },
      { name: "q", type: "TreeNode" },
    ],
    returns: "bool",
  },
  description: `
Given the roots \`p\` and \`q\` of two binary trees, return \`true\` if the trees are **identical**: they have exactly the same shape, and every pair of corresponding nodes holds the same value. Otherwise return \`false\`.

Trees are written in level order with \`null\` for missing children.
`,
  constraints: ["Each tree has between 0 and 100 nodes", "-10^4 <= Node.val <= 10^4"],
  examples: [
    { explanation: "Same shape and the same value in every position." },
    { explanation: "Same values, but 2 is a left child in p and a right child in q." },
    { explanation: "Same shape, but the leaves are swapped." },
  ],
};
