module.exports = {
  slug: "search-in-rotated-sorted-array",
  signature: {
    method: "search",
    params: [
      { name: "nums", type: "int[]" },
      { name: "target", type: "int" },
    ],
    returns: "int",
  },
  description: `
\`nums\` is an increasing array of **distinct** integers that may have been rotated: a block of elements was moved, in order, from the front to the back (for example \`[2, 4, 7, 9, 11]\` can become \`[9, 11, 2, 4, 7]\`).

Return the index of \`target\` in \`nums\`, or \`-1\` if it is not there.

Your solution should run in **O(log n)** time.
`,
  constraints: [
    "1 <= nums.length <= 10^5",
    "-10^6 <= nums[i], target <= 10^6",
    "All values in nums are distinct",
    "nums is a sorted array rotated by some amount",
  ],
  examples: [
    { explanation: "9 is at index 2." },
    { explanation: "4 does not appear in the array." },
    { explanation: "A single element that matches." },
  ],
  notes: "O(log n) is stated but not enforceable at this input size.",
};
