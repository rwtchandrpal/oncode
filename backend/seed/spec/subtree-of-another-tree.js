module.exports = {
  slug: "subtree-of-another-tree",
  signature: {
    method: "isSubtree",
    params: [
      { name: "root", type: "TreeNode" },
      { name: "subRoot", type: "TreeNode" },
    ],
    returns: "bool",
  },
  description: `
Given the roots of two binary trees \`root\` and \`subRoot\`, return \`true\` if \`root\` contains a node whose **entire subtree** (that node and all of its descendants) is identical to \`subRoot\` in shape and values. Otherwise return \`false\`.

A tree counts as a subtree of itself. Matching only the top part of a subtree is not enough: the match must go all the way down to the leaves.
`,
  constraints: ["root has between 1 and 2000 nodes", "subRoot has between 1 and 1000 nodes", "-10^4 <= Node.val <= 10^4"],
  examples: [
    { explanation: "The subtree rooted at 4 is exactly [4, 1, 2]." },
    { explanation: "The node 4 matches the top, but in root its child 2 has an extra child 0." },
    { explanation: "Every tree is a subtree of itself." },
  ],
};
