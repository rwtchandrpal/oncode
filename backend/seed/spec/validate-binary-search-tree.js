module.exports = {
  slug: "validate-binary-search-tree",
  signature: { method: "isValidBST", params: [{ name: "root", type: "TreeNode" }], returns: "bool" },
  description: `
Given the \`root\` of a binary tree, return \`true\` if it is a valid **binary search tree**, which means that for **every** node:

- every value in its left subtree is **strictly less** than the node's value,
- every value in its right subtree is **strictly greater** than the node's value.

Checking only each node against its own children is not enough: a value deep in the left subtree must still be smaller than every ancestor it sits to the left of. Equal values are not allowed.
`,
  constraints: ["The number of nodes is between 1 and 10^4", "-2^31 <= Node.val <= 2^31 - 1"],
  examples: [
    { explanation: "3 < 5 < 8, and both children are leaves." },
    { explanation: "6 is a right child of 3, which is fine locally, but 6 is in 5's left subtree and 6 > 5." },
    { explanation: "Equal values are not allowed on either side." },
  ],
};
