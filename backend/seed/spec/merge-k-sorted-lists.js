module.exports = {
  slug: "merge-k-sorted-lists",
  signature: { method: "mergeKLists", params: [{ name: "lists", type: "ListNode[]" }], returns: "ListNode" },
  description: `
You are given an array \`lists\` of \`k\` linked lists, each sorted in **non-decreasing** order. Merge all of them into a single sorted linked list and return its head.

The input is written as an array of lists, e.g. \`[[1,4],[2,3]]\`; an empty inner array is an empty list.

Merging the lists one after another can cost O(k * N) for N nodes in total. Aim for **O(N log k)**, for example with a min-heap or by merging in pairs.
`,
  constraints: [
    "0 <= k <= 10^4",
    "0 <= lists[i].length <= 500",
    "-10^4 <= Node.val <= 10^4",
    "Each lists[i] is sorted in non-decreasing order",
    "The total number of nodes is at most 10^4",
  ],
  examples: [
    { explanation: "All eight values in one sorted list." },
    { explanation: "No lists at all." },
    { explanation: "One list, and it is empty." },
  ],
};
