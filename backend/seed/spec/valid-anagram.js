module.exports = {
  slug: "valid-anagram",
  signature: {
    method: "isAnagram",
    params: [
      { name: "s", type: "string" },
      { name: "t", type: "string" },
    ],
    returns: "bool",
  },
  description: `
Two strings are **anagrams** of each other when one can be turned into the other by rearranging its letters, using every letter exactly as many times as it appears.

Given strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.
`,
  constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters only"],
  examples: [
    { explanation: "Both strings contain one each of e, i, l, n, s and t." },
    { explanation: "\"rocket\" has an r where \"pocket\" has a p." },
    { explanation: "The strings have different lengths, so the letter counts cannot match." },
  ],
};
