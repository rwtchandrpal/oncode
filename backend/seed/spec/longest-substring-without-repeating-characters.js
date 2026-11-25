module.exports = {
  slug: "longest-substring-without-repeating-characters",
  signature: { method: "lengthOfLongestSubstring", params: [{ name: "s", type: "string" }], returns: "int" },
  description: `
Given a string \`s\`, return the length of the longest **substring** (contiguous block of characters) in which **no character appears twice**.

\`s\` may contain letters, digits, symbols and spaces, and may be empty.
`,
  constraints: ["0 <= s.length <= 5 * 10^4", "s consists of printable ASCII characters (codes 32 to 126)"],
  examples: [
    { explanation: "\"mzuxt\" has five different characters. Any longer block repeats m or t." },
    { explanation: "Every block longer than one character repeats 'a'." },
    { explanation: "The empty string has no characters." },
  ],
};
