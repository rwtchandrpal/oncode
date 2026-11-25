module.exports = {
  slug: "house-robber-ii",
  signature: { method: "rob", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
This time the houses are built in a **circle**: house \`0\` and house \`n - 1\` are neighbours. \`nums[i]\` is the money in house \`i\`, and as before no two **adjacent** houses may both be robbed, which now also forbids robbing the first and last house together.

Return the largest amount that can be taken.
`,
  constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
  examples: [
    { explanation: "Houses 0 and 2 are neighbours through the circle, so only one house can be robbed. The best is house 1." },
    { explanation: "Rob houses 1 and 3 for 1 + 7 = 8. Houses 0 and 3 touch, so 4 + 7 is not allowed." },
    { explanation: "With a single house there are no neighbours to worry about." },
  ],
};
