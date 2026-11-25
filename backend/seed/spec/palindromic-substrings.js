module.exports = {
  slug: "palindromic-substrings",
  signature: { method: "countSubstrings", params: [{ name: "s", type: "string" }], returns: "int" },
  description: `
Given a string \`s\`, count how many of its **substrings** are palindromes (read the same forwards and backwards).

A substring is a contiguous, non-empty block of characters. Substrings at different positions are counted separately even if they contain the same letters, so every single character counts once.
`,
  constraints: ["1 <= s.length <= 1000", "s consists of lowercase English letters only"],
  examples: [
    { explanation: "The four single letters, \"bb\" and \"abba\": 6 in total." },
    { explanation: "Only the three single letters." },
    { explanation: "\"a\" three times, \"aa\" twice and \"aaa\" once." },
  ],
};
