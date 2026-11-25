module.exports = {
  slug: "longest-common-subsequence",
  signature: {
    method: "longestCommonSubsequence",
    params: [
      { name: "text1", type: "string" },
      { name: "text2", type: "string" },
    ],
    returns: "int",
  },
  description: `
A **subsequence** of a string is what remains after deleting any number of characters (possibly none) without changing the order of the rest. For example, \`"ace"\` is a subsequence of \`"abcde"\`.

Given two strings \`text1\` and \`text2\`, return the length of their longest **common** subsequence: the longest string that is a subsequence of both. Return \`0\` if they share no characters.
`,
  constraints: ["1 <= text1.length, text2.length <= 1000", "Both strings consist of lowercase English letters only"],
  examples: [
    { explanation: "\"one\" appears in order in both \"stone\" and \"longest\"." },
    { explanation: "The strings have no character in common." },
    { explanation: "\"aa\" is the whole of text2 and appears in text1." },
  ],
};
