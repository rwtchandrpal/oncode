const { randomTree, randomEdges, checkUndirected } = require("./_graphs");

module.exports = {
  samples: [
    { n: 4, edges: [[0, 1], [1, 2], [1, 3]] },
    { n: 4, edges: [[0, 1], [1, 2], [2, 0]] },
    { n: 1, edges: [] },
  ],

  hidden(rng) {
    const tree = randomTree(rng, 2000);
    const extra = randomEdges(rng, 2000, 1, tree);
    // two separate trees, plus one extra edge inside the first: n - 1 edges but not a tree
    const forest = [...randomTree(rng, 1000), ...randomTree(rng, 1000).map(([a, b]) => [a + 1000, b + 1000])];
    const twoPieces = [...forest, ...randomEdges(rng, 1000, 1, forest)];
    return [
      { note: "two nodes, no edge", args: { n: 2, edges: [] } },
      { note: "two nodes, one edge", args: { n: 2, edges: [[1, 0]] } },
      { note: "random tree on 2000 nodes", args: { n: 2000, edges: tree } },
      { note: "random tree plus one edge", args: { n: 2000, edges: rng.shuffle([...tree, ...extra]) } },
      { note: "n-1 edges but a cycle and two pieces", args: { n: 2000, edges: rng.shuffle(twoPieces) } },
      { note: "path of 2000 nodes", args: { n: 2000, edges: rng.shuffle(Array.from({ length: 1999 }, (_, i) => [i, i + 1])) } },
      { note: "star with the centre at 1999", args: { n: 2000, edges: Array.from({ length: 1999 }, (_, i) => [1999, i]) } },
    ];
  },

  validate({ n, edges }) {
    if (n < 1 || n > 2000) throw new Error("n out of range");
    if (edges.length > 5000) throw new Error("too many edges");
    checkUndirected(n, edges);
  },
};
