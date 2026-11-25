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
  notes: "Largest tests are 150 x 150 / 100 x 100 so inputs stay under 200 KB and recursive Java DFS keeps a sane depth.",
};
