module.exports = {
  slug: "word-search",
  signature: {
    method: "exist",
    params: [
      { name: "board", type: "char[][]" },
      { name: "word", type: "string" },
    ],
    returns: "bool",
  },
  description: `
You are given an \`m x n\` grid of letters \`board\` and a string \`word\`. Decide whether \`word\` can be traced on the board by starting at some cell and repeatedly stepping to a **horizontally or vertically adjacent** cell, reading one letter per cell.

A cell may be used **at most once** in the same trace. Letters are case-sensitive. Return \`true\` if the word can be traced, and \`false\` otherwise.
`,
  constraints: [
    "m == board.length, n == board[i].length",
    "1 <= m, n <= 6",
    "1 <= word.length <= 15",
    "board and word consist of uppercase and lowercase English letters",
  ],
  examples: [
    { explanation: "C (0,0) -> A (0,1) -> T (0,2) -> S (1,2)." },
    { explanation: "After C, the next letter must be O, but neither neighbour of C is an O." },
    { explanation: "The single cell spells the word." },
  ],
};
