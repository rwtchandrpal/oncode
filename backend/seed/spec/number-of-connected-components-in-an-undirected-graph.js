module.exports = {
  slug: "number-of-connected-components-in-an-undirected-graph",
  signature: {
    method: "countComponents",
    params: [
      { name: "n", type: "int" },
      { name: "edges", type: "int[][]" },
    ],
    returns: "int",
  },
  description: `
A graph has \`n\` nodes labelled \`0\` to \`n - 1\`, and \`edges[i] = [a, b]\` is an undirected edge between nodes \`a\` and \`b\`.

A **connected component** is a largest group of nodes in which every node can reach every other through edges. A node with no edges is a component on its own.

Return the number of connected components.
`,
  constraints: [
    "1 <= n <= 2000",
    "0 <= edges.length <= 5000",
    "edges[i].length == 2, 0 <= a, b < n, a != b",
    "No edge appears twice (in either direction)",
  ],
  examples: [
    { explanation: "{0, 1, 2} are linked together; {3, 4} form the second component." },
    { explanation: "The cycle 0-1-2 is one component, and nodes 3 and 4 have no edges." },
    { explanation: "Three nodes and no edges: each node is its own component." },
  ],
};
