module.exports = {
  slug: "graph-valid-tree",
  signature: {
    method: "validTree",
    params: [
      { name: "n", type: "int" },
      { name: "edges", type: "int[][]" },
    ],
    returns: "bool",
  },
  description: `
You are given \`n\` nodes labelled \`0\` to \`n - 1\` and a list of undirected edges, where \`edges[i] = [a, b]\` connects nodes \`a\` and \`b\`.

Return \`true\` if these edges form a **valid tree**: every node is reachable from every other node, and there are no cycles. Otherwise return \`false\`.
`,
  constraints: [
    "1 <= n <= 2000",
    "0 <= edges.length <= 5000",
    "edges[i].length == 2, 0 <= a, b < n, a != b",
    "No edge appears twice (in either direction)",
  ],
  examples: [
    { explanation: "Node 1 connects to 0, 2 and 3: connected, 3 edges for 4 nodes, no cycle." },
    { explanation: "0-1-2-0 is a cycle, and node 3 is not connected to anything." },
    { explanation: "A single node with no edges is a tree." },
  ],
};
