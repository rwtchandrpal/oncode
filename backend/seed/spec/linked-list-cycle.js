module.exports = {
  slug: "linked-list-cycle",
  signature: {
    method: "hasCycle",
    params: [
      { name: "head", type: "ListNode" },
      { name: "pos", type: "int", driverOnly: true },
    ],
    returns: "bool",
  },
  // Builds the cycle: the last node's next points at the node with index pos (pos = -1: no cycle).
  prelude: {
    cpp: [
      "if (pos >= 0) {",
      "    ListNode* oc_target = nullptr;",
      "    ListNode* oc_tail = head;",
      "    int oc_i = 0;",
      "    for (ListNode* oc_c = head; oc_c; oc_c = oc_c->next, oc_i++) {",
      "        if (oc_i == pos) oc_target = oc_c;",
      "        oc_tail = oc_c;",
      "    }",
      "    oc_tail->next = oc_target;",
      "}",
    ].join("\n"),
    java: [
      "if (pos >= 0) {",
      "    ListNode oc_target = null, oc_tail = head;",
      "    int oc_i = 0;",
      "    for (ListNode oc_c = head; oc_c != null; oc_c = oc_c.next, oc_i++) {",
      "        if (oc_i == pos) oc_target = oc_c;",
      "        oc_tail = oc_c;",
      "    }",
      "    oc_tail.next = oc_target;",
      "}",
    ].join("\n"),
  },
  description: `
Given \`head\`, the first node of a linked list, return \`true\` if the list contains a **cycle**: following \`next\` pointers from \`head\` eventually returns to a node already visited. Return \`false\` if the list ends (some node's \`next\` is null).

**How the tests describe the list:** the input gives the node values and an index \`pos\`. The judge links the **last node's \`next\` to the node at index \`pos\`** (0-based) before calling your method; \`pos = -1\` means no cycle. \`pos\` is **not** passed to your method, which only receives \`head\`.

**Follow-up:** can you solve it with O(1) extra memory?
`,
  constraints: ["The number of nodes is between 0 and 10^4", "-10^5 <= Node.val <= 10^5", "pos is -1 or a valid index in the list"],
  examples: [
    { explanation: "The last node (3) links back to index 2 (value 9), so 9 -> 3 -> 9 -> ... loops forever." },
    { explanation: "pos = -1: the list ends after 6." },
    { explanation: "The only node points to itself." },
  ],
  notes: "pos is driver-only: the driver builds the cycle before calling hasCycle(head).",
};
