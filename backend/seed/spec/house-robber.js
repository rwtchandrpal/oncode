module.exports = {
  slug: "house-robber",
  signature: { method: "rob", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
Houses stand in a row, and \`nums[i]\` is the amount of money hidden in house \`i\`. A burglar may take the money from any set of houses, with one rule: **no two adjacent houses** may both be robbed, because neighbouring alarms are linked.

Return the largest total amount that can be taken without breaking the rule.
`,
  constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
  examples: [
    { explanation: "Rob houses 0 and 3: 5 + 5 = 10." },
    { explanation: "Rob only the middle house; robbing both ends gives just 6." },
    { explanation: "There is a single house." },
  ],
};
