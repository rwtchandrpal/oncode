module.exports = {
  slug: "longest-consecutive-sequence",
  signature: { method: "longestConsecutive", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
Given an **unsorted** integer array \`nums\`, find the longest run of consecutive integers \`x, x + 1, x + 2, ...\` whose values all appear somewhere in \`nums\`. The values do not have to be next to each other in the array, and a repeated value counts only once.

Return the length of that run. An empty array has answer \`0\`.

Aim for an **O(n)** solution.
`,
  constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
  examples: [
    { explanation: "The values 1, 2, 3 and 4 are all present, a run of length 4." },
    { explanation: "Both -1, 0, 1 and 5, 6, 7 are runs of length 3." },
    { explanation: "There are no values at all." },
  ],
};
