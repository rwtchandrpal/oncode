module.exports = {
  slug: "remove-nth-node-from-end-of-list",
  signature: {
    method: "removeNthFromEnd",
    params: [
      { name: "head", type: "ListNode" },
      { name: "n", type: "int" },
    ],
    returns: "ListNode",
  },
  description: `
Given the \`head\` of a linked list, remove the \`n\`-th node **counting from the end** (\`n = 1\` is the last node) and return the head of the resulting list.

**Follow-up:** can you do it in a single pass over the list?
`,
  constraints: ["The number of nodes sz is between 1 and 30", "0 <= Node.val <= 100", "1 <= n <= sz"],
  examples: [
    { explanation: "n = 1 removes the last node, 8." },
    { explanation: "Removing the only node leaves an empty list." },
    { explanation: "n = 2 in a two-node list removes the head, 3." },
  ],
};
