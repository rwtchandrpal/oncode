module.exports = {
  slug: "reverse-linked-list",
  signature: { method: "reverseList", params: [{ name: "head", type: "ListNode" }], returns: "ListNode" },
  description: `
You are given the \`head\` of a singly linked list. Reverse the list so that its last node becomes the first, and return the new head.

Lists are written as arrays of node values from head to tail; \`[]\` is the empty list (\`head\` is null).

**Follow-up:** solve it both iteratively and recursively.
`,
  constraints: ["The number of nodes is between 0 and 5000", "-5000 <= Node.val <= 5000"],
  examples: [
    { explanation: "The links are turned around, so 1 is now first and 3 last." },
    { explanation: "Reversing an empty list gives an empty list." },
    { explanation: "Two nodes swap places." },
  ],
};
