module.exports = {
  slug: "minimum-window-substring",
  signature: {
    method: "minWindow",
    params: [
      { name: "s", type: "string" },
      { name: "t", type: "string" },
    ],
    returns: "string",
  },
  description: `
Given strings \`s\` and \`t\`, find the **shortest substring** of \`s\` that contains every character of \`t\`, **counting duplicates**: if \`t\` has two \`a\`'s, the window needs at least two \`a\`'s. Letters are case-sensitive.

Return that substring, or the empty string \`""\` if no window of \`s\` contains all of \`t\`.

The tests are chosen so that the shortest window is **unique**. Aim for O(m + n) time.
`,
  constraints: [
    "1 <= s.length, t.length <= 10^5",
    "s and t consist of uppercase and lowercase English letters",
    "The shortest valid window, if any, is unique",
  ],
  examples: [
    { explanation: "\"AYBZC\" is the only block that contains A, B and C." },
    { explanation: "t needs two a's, so the whole of s is required." },
    { explanation: "s has no 'b', so no window works." },
  ],
};
