module.exports = {
  slug: "two-sum",
  signature: {
    method: "twoSum",
    params: [
      { name: "nums", type: "int[]" },
      { name: "target", type: "int" },
    ],
    returns: "int[]",
  },
  // Either index order is accepted: the driver sorts the two indices before printing.
  post: {
    cpp: "sort(oc_res.begin(), oc_res.end());",
    java: "Arrays.sort(oc_res);",
  },
  description: `
Given an integer array \`nums\` and an integer \`target\`, find the two **different positions** \`i\` and \`j\` such that \`nums[i] + nums[j] == target\`, and return them as an array \`[i, j]\`.

Every test has **exactly one** such pair of positions. You may not use the same position twice, although two different positions may hold equal values. The two indices may be returned in either order.
`,
  constraints: [
    "2 <= nums.length <= 10^5",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Exactly one pair of indices adds up to target",
  ],
  examples: [
    { explanation: "nums[1] + nums[3] = 8 + 2 = 10." },
    { explanation: "nums[1] + nums[2] = -2 + 9 = 7." },
    { explanation: "The two equal values at indices 0 and 1 add up to 12." },
  ],
  notes: "Driver sorts the returned indices, so [j, i] is accepted too.",
};
