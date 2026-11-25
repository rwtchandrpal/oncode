module.exports = {
  slug: "longest-repeating-character-replacement",
  signature: {
    method: "characterReplacement",
    params: [
      { name: "s", type: "string" },
      { name: "k", type: "int" },
    ],
    returns: "int",
  },
  description: `
You are given a string \`s\` of uppercase English letters and an integer \`k\`. You may change **at most \`k\`** characters of \`s\`, each into any other uppercase letter.

After your changes, return the length of the longest substring made of **one repeated letter**.
`,
  constraints: ["1 <= s.length <= 10^5", "s consists of uppercase English letters", "0 <= k <= s.length"],
  examples: [
    { explanation: "Change the last X to Y: \"XYYY\" contains \"YYY\". Changing the first X instead gives the same length." },
    { explanation: "No changes are allowed and no letter repeats, so the best is a single letter." },
    { explanation: "Change both B's to A: the whole string becomes \"AAAAA\"." },
  ],
};
