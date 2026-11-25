module.exports = {
  slug: "word-break",
  signature: {
    method: "wordBreak",
    params: [
      { name: "s", type: "string" },
      { name: "wordDict", type: "List<string>" },
    ],
    returns: "bool",
  },
  description: `
Given a string \`s\` and a list of distinct words \`wordDict\`, decide whether \`s\` can be cut into pieces so that **every piece is a word from the list**.

A word may be used any number of times. Return \`true\` if such a split exists, and \`false\` otherwise.
`,
  constraints: [
    "1 <= s.length <= 300",
    "1 <= wordDict.length <= 1000",
    "1 <= wordDict[i].length <= 20",
    "s and every word consist of lowercase English letters",
    "The words in wordDict are distinct",
  ],
  examples: [
    { explanation: "\"hot\" + \"dog\" + \"stand\". Starting with \"hot\" + \"dogs\" leads to a dead end, but another split works." },
    { explanation: "\"car\" leaves \"pet\", and \"care\" leaves \"t\"; neither remainder can be built." },
    { explanation: "\"ab\" used twice." },
  ],
};
