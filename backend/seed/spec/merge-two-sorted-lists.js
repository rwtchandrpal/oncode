module.exports = {
  slug: "merge-two-sorted-lists",
  signature: {
    method: "mergeTwoLists",
    params: [
      { name: "list1", type: "ListNode" },
      { name: "list2", type: "ListNode" },
    ],
    returns: "ListNode",
  },
  description: `
\`list1\` and \`list2\` are the heads of two linked lists, each sorted in **non-decreasing** order. Combine them into a single sorted list by **relinking their existing nodes**, and return the head of the merged list.

Lists are written as arrays of node values from head to tail; \`[]\` is an empty list.
`,
  constraints: ["Each list has between 0 and 50 nodes", "-100 <= Node.val <= 100", "Both lists are sorted in non-decreasing order"],
  examples: [
    { explanation: "Take the smaller front node each time: 1, 2, 5, 5, 6, 9." },
    { explanation: "Two empty lists merge into an empty list." },
    { explanation: "One list is empty, so the result is the other list." },
  ],
};
