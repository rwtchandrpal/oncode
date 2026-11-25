module.exports = {
  slug: "maximum-subarray",
  signature: { method: "maxSubArray", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
Given an integer array \`nums\`, choose a **non-empty contiguous** block of elements (a subarray) whose sum is as large as possible, and return that sum.

The subarray must contain at least one element, so if every number is negative the answer is the largest single element.
`,
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    { explanation: "The block [5, -1, 2] sums to 6." },
    { explanation: "Every element is negative, so the best block is the single element -1." },
    { explanation: "The only subarray is [6]." },
  ],
};
