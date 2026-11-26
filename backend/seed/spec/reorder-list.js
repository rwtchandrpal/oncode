module.exports = {
  slug: "reorder-list",
  signature: { method: "reorderList", params: [{ name: "head", type: "ListNode" }], returns: "void", printParam: "head" },
  description: `
A linked list has nodes \`L0 -> L1 -> L2 -> ... -> Ln\`. Rearrange its nodes into the order

\`L0 -> Ln -> L1 -> Ln-1 -> L2 -> Ln-2 -> ...\`

taking alternately from the front and the back. Change the links between the existing nodes; do not change the values stored in them.

The method returns nothing. The judge prints the list starting from the original \`head\` after your method finishes.
`,
  constraints: ["The number of nodes is between 1 and 5 * 10^4", "1 <= Node.val <= 1000"],
  examples: [
    { explanation: "Front, back, front, back...: 10, 50, 20, 40, then the middle node 30." },
    { explanation: "With two nodes the order does not change." },
    { explanation: "A single node stays as it is." },
  ],
  notes: "In-place problem: the driver prints the list from the original head after the call.",
};
