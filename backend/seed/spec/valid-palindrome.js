module.exports = {
  slug: "valid-palindrome",
  signature: { method: "isPalindrome", params: [{ name: "s", type: "string" }], returns: "bool" },
  description: `
Take the string \`s\`, convert every uppercase letter to lowercase, and throw away every character that is not a letter or a digit. If what remains reads the same forwards and backwards, \`s\` is a **valid palindrome**.

Return \`true\` if \`s\` is a valid palindrome, and \`false\` otherwise. A string with no letters or digits leaves nothing behind, and the empty string counts as a palindrome.
`,
  constraints: ["1 <= s.length <= 2 * 10^5", "s consists of printable ASCII characters (codes 32 to 126)"],
  examples: [
    { explanation: "After cleaning, the string is \"steponnopets\", which is the same reversed." },
    { explanation: "After cleaning, the string is \"palindromenot\", which reversed is \"tonemordnilap\"." },
    { explanation: "Nothing is left after removing the punctuation, and an empty string is a palindrome." },
  ],
  notes: "No slow variant: the natural wrong approaches are already linear.",
};
