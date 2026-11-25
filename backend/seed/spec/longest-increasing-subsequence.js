module.exports = {
  slug: "longest-increasing-subsequence",
  signature: { method: "lengthOfLIS", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
A **subsequence** keeps some elements of an array in their original order and drops the rest (for example \`[4, 9]\` is a subsequence of \`[3, 4, 1, 9]\`).

Given an integer array \`nums\`, return the length of the longest subsequence that is **strictly increasing**: each element is greater than the one before it, so equal values cannot both be used.

An O(n²) dynamic programming solution passes. **Follow-up:** can you do it in O(n log n)?
`,
  constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    { explanation: "One longest choice is 1, 4, 5, 9 (another is 1, 4, 5, 6)." },
    { explanation: "All values are equal, and equal values cannot follow each other." },
    { explanation: "1, 2, 3 is increasing; the trailing 0 cannot extend it." },
  ],
};
