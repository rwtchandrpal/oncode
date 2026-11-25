module.exports = {
  slug: "missing-number",
  signature: { method: "missingNumber", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
The array \`nums\` has length \`n\` and holds \`n\` **distinct** numbers taken from the range \`[0, n]\`. That range contains \`n + 1\` numbers, so exactly one of them is absent from \`nums\`.

Return the number from \`[0, n]\` that does not appear in \`nums\`.
`,
  constraints: ["n == nums.length", "1 <= n <= 10^5", "0 <= nums[i] <= n", "All values in nums are distinct"],
  examples: [
    { explanation: "n = 4, so the range is [0, 4]. Every value except 2 is present." },
    { explanation: "n = 1, so the range is [0, 1]. Only 1 is present." },
    { explanation: "n = 3, so the range is [0, 3]. The missing value is n itself." },
  ],
};
