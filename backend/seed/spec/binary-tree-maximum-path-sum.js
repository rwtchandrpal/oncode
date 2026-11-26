module.exports = {
  slug: "binary-tree-maximum-path-sum",
  signature: { method: "maxPathSum", params: [{ name: "root", type: "TreeNode" }], returns: "int" },
  description: `
A **path** in a binary tree is a sequence of nodes where each pair of neighbours in the sequence is connected by an edge, and no node appears more than once. A path can start and end at **any** nodes: it does not have to pass through the root or reach a leaf, and it may go up through a node and back down the other side. It contains at least one node.

The **path sum** is the sum of the values on the path. Given the \`root\` of a binary tree, return the largest path sum.
`,
  constraints: ["The number of nodes is between 1 and 3 * 10^4", "-1000 <= Node.val <= 1000"],
  examples: [
    { explanation: "The path 2 -> 3 sums to 5; extending it to the -1 on the other side would only lower it." },
    { explanation: "A single negative node: the path must contain at least one node." },
    { explanation: "The path 8 -> 6 (sum 14) beats any path through the negative root." },
  ],
};
