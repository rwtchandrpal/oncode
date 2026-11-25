module.exports = {
  slug: "counting-bits",
  signature: { method: "countBits", params: [{ name: "n", type: "int" }], returns: "int[]" },
  description: `
Given a non-negative integer \`n\`, build an array \`ans\` of length \`n + 1\` where \`ans[i]\` is the number of \`1\` bits in the binary representation of \`i\`, for every \`i\` from \`0\` to \`n\`.

Return \`ans\`.

**Follow-up:** counting the bits of each number separately takes O(n log n). Can you do it in O(n), reusing answers you have already computed?
`,
  constraints: ["0 <= n <= 10^5"],
  examples: [
    { explanation: "0 = 0, 1 = 1, 2 = 10 in binary." },
    { explanation: "3 = 11, 4 = 100 and 5 = 101 have 2, 1 and 2 set bits." },
    { explanation: "Only the number 0, which has no set bits." },
  ],
  notes: "No slow variant: the per-number O(n log n) approach is acceptable at this size.",
};
