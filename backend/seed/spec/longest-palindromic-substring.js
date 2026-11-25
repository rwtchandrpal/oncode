module.exports = {
  slug: "longest-palindromic-substring",
  signature: { method: "longestPalindrome", params: [{ name: "s", type: "string" }], returns: "string" },
  description: `
Given a string \`s\`, return its longest **substring** (contiguous block of characters) that is a palindrome, meaning it reads the same forwards and backwards.

The tests are chosen so that the longest palindromic substring is **unique**: no two different strings tie for the maximum length.
`,
  constraints: [
    "1 <= s.length <= 1000",
    "s consists of English letters and digits",
    "The longest palindromic substring is unique",
  ],
  examples: [
    { explanation: "\"racecar\" (length 7) is the longest block that reads the same both ways." },
    { explanation: "\"noon\" has even length, centred between the two o's." },
    { explanation: "A single character is a palindrome." },
  ],
  notes: "Generator guarantees a unique answer, so the output is compared directly (no validator).",
};
