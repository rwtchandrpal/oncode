module.exports = {
  slug: "number-of-islands",
  signature: { method: "numIslands", params: [{ name: "grid", type: "char[][]" }], returns: "int" },
  description: `
\`grid\` is a map made of \`"1"\` (land) and \`"0"\` (water). An **island** is a group of land cells connected **horizontally or vertically** (diagonals do not connect). Everything outside the grid is water.

Return the number of islands.
`,
  constraints: ["m == grid.length, n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is \"0\" or \"1\""],
  examples: [
    { explanation: "Three separate groups of land: top-left, centre and bottom-right." },
    { explanation: "Land cells that only touch diagonally belong to different islands." },
    { explanation: "Only water." },
  ],
  notes: "Largest fully connected island is 70 x 70: recursive Java DFS overflows the default JVM stack near 10^4 levels on Judge0 (see DECISIONS.md).",
};
