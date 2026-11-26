module.exports = {
  slug: "kth-smallest-element-in-a-bst",
  signature: {
    method: "kthSmallest",
    params: [
      { name: "root", type: "TreeNode" },
      { name: "k", type: "int" },
    ],
    returns: "int",
  },
  description: `
Given the \`root\` of a binary search tree and an integer \`k\`, return the \`k\`-th smallest value stored in the tree (\`k = 1\` is the smallest).

**Follow-up:** if the tree were modified often and you had to answer this query many times, how would you speed it up?
`,
  constraints: ["The number of nodes n is between 1 and 10^4", "1 <= k <= n", "0 <= Node.val <= 10^4", "All values are unique"],
  examples: [
    { explanation: "In order the values are 2, 3, 4, 5, 6, 7, 8; the third is 4." },
    { explanation: "A single node." },
    { explanation: "In order: 1, 2, 3, 4. The fourth smallest is the root." },
  ],
};
