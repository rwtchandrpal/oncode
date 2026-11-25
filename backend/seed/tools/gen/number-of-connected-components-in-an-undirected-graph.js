const { randomTree, randomEdges, checkUndirected } = require("./_graphs");

// `parts` separate random trees over a shuffled labelling of 0..n-1.
const forest = (rng, n, parts) => {
  const labels = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const edges = [];
  let start = 0;
  for (let p = 0; p < parts; p++) {
    const size = p === parts - 1 ? n - start : Math.floor(n / parts);
    for (const [a, b] of randomTree(rng, size)) edges.push([labels[start + a], labels[start + b]]);
    start += size;
  }
  return rng.shuffle(edges);
};

module.exports = {
  samples: [
    { n: 5, edges: [[0, 1], [1, 2], [3, 4]] },
    { n: 5, edges: [[0, 1], [1, 2], [2, 0]] },
    { n: 3, edges: [] },
  ],

  hidden(rng) {
    const f = forest(rng, 2000, 17);
    return [
      { note: "single node", args: { n: 1, edges: [] } },
      { note: "2000 isolated nodes", args: { n: 2000, edges: [] } },
      { note: "one random tree on 2000 nodes", args: { n: 2000, edges: randomTree(rng, 2000) } },
      { note: "17 trees", args: { n: 2000, edges: f } },
      {
        note: "two cycles of 1000 nodes",
        args: { n: 2000, edges: rng.shuffle(Array.from({ length: 2000 }, (_, i) => (i < 1000 ? [i, (i + 1) % 1000] : [i, 1000 + ((i + 1) % 1000)]))) },
      },
      { note: "5000 random edges on 2000 nodes", args: { n: 2000, edges: randomEdges(rng, 2000, 5000) } },
      { note: "1500 random edges on 2000 nodes", args: { n: 2000, edges: randomEdges(rng, 2000, 1500) } },
    ];
  },

  validate({ n, edges }) {
    if (n < 1 || n > 2000) throw new Error("n out of range");
    if (edges.length > 5000) throw new Error("too many edges");
    checkUndirected(n, edges);
  },
};
