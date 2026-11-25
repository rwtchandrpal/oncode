module.exports = {
  slug: "contains-duplicate",
  signature: { method: "containsDuplicate", params: [{ name: "nums", type: "int[]" }], returns: "bool" },
  description: `
You are given an integer array \`nums\`. Decide whether any value occurs **more than once** in it.

Return \`true\` if at least one value repeats, and \`false\` if every element is distinct.
`,
  constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
  examples: [
    { explanation: "The value 1 appears at index 1 and again at index 3." },
    { explanation: "All four values are different." },
    { explanation: "Both elements are -6." },
  ],
};
