module.exports = {
  slug: "pacific-atlantic-water-flow",
  signature: { method: "pacificAtlantic", params: [{ name: "heights", type: "int[][]" }], returns: "List<List<int>>" },
  // Any order of cells is accepted: the driver sorts the list of [row, col] pairs.
  post: {
    cpp: "sort(oc_res.begin(), oc_res.end());",
    java: "oc_res = sortLists(oc_res, false);",
  },
  description: `
An island is divided into an \`m x n\` grid of cells, and \`heights[r][c]\` is the height of cell \`(r, c)\`. The **Pacific Ocean** touches the island's top and left edges; the **Atlantic Ocean** touches its bottom and right edges.

Rain on a cell flows to a horizontally or vertically adjacent cell whose height is **less than or equal to** the current cell's. Water flows from any cell on the edge of the grid into the ocean next to that edge.

Return the coordinates \`[r, c]\` of every cell from which rain can reach **both** oceans, in any order.
`,
  constraints: ["m == heights.length, n == heights[r].length", "1 <= m, n <= 200", "0 <= heights[r][c] <= 10^5"],
  examples: [
    { explanation: "Corner cells touch both oceans. The centre (height 5) can drain both up-left and down-right." },
    { explanation: "A single cell touches all four edges." },
    { explanation: "Flat ground: water can go anywhere, so every cell reaches both oceans." },
  ],
  notes: "Driver sorts the returned cells, so any order is accepted.",
};
