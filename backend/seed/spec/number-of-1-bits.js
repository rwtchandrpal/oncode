module.exports = {
  slug: "number-of-1-bits",
  signature: { method: "hammingWeight", params: [{ name: "n", type: "int" }], returns: "int" },
  description: `
Given a positive integer \`n\`, return how many bits are set to \`1\` in its binary representation (this count is also called the *Hamming weight* of \`n\`).
`,
  constraints: ["1 <= n <= 2^31 - 1"],
  examples: [
    { explanation: "11 in binary is 1011, which has three 1 bits." },
    { explanation: "128 in binary is 10000000, a single 1 bit." },
    { explanation: "2147483645 in binary is 1111111111111111111111111111101: 31 digits, all 1 except the second to last." },
  ],
  notes: "No large case: input is a single integer, so every reasonable solution is O(32).",
};
