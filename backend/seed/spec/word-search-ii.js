module.exports = {
  slug: "word-search-ii",
  signature: {
    method: "findWords",
    params: [
      { name: "board", type: "char[][]" },
      { name: "words", type: "string[]" },
    ],
    returns: "List<string>",
  },
  // Any order is accepted: the driver sorts the returned words.
  post: {
    cpp: "sort(oc_res.begin(), oc_res.end());",
    java: "oc_res = sortList(oc_res);",
  },
  description: `
Given an \`m x n\` grid of letters \`board\` and a list of distinct \`words\`, return every word from the list that can be traced on the board.

A word is traced by starting on any cell and moving to **horizontally or vertically adjacent** cells, one letter per cell. A cell may not be used twice **within the same word** (different words may reuse cells). Return the found words in any order, each once.

Searching the grid separately for every word is too slow when the list is long. Build a trie of the words and search for all of them at once.
`,
  constraints: [
    "m == board.length, n == board[i].length",
    "1 <= m, n <= 12",
    "board[i][j] is a lowercase English letter",
    "1 <= words.length <= 3 * 10^4",
    "1 <= words[i].length <= 10",
    "words[i] consists of lowercase English letters; all words are distinct",
  ],
  examples: [
    { explanation: "\"cat\" and \"dog\" can be traced; \"cow\" cannot (c and o are not adjacent in the right way). Printed sorted." },
    { explanation: "\"aba\" would need to use the first cell twice." },
    { explanation: "The single cell spells \"z\"." },
  ],
  notes: "Driver sorts the returned words, so any order is accepted.",
};
