const { randomTree, randomEdges } = require("./_graphs");

// Connected undirected graph on n nodes (values 1..n) as an adjacency list.
const graph = (rng, n, extraEdges) => {
  const edges = [...randomTree(rng, n), ...(extraEdges ? randomEdges(rng, n, extraEdges, randomTree(rng, n)) : [])];
  const key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
  const seen = new Set();
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    if (seen.has(key(a, b))) continue;
    seen.add(key(a, b));
    adj[a].push(b + 1);
    adj[b].push(a + 1);
  }
  return adj.map((l) => rng.shuffle(l));
};

module.exports = {
  samples: [{ adjList: [[2, 4], [1, 3], [2, 4], [1, 3]] }, { adjList: [] }, { adjList: [[]] }],

  hidden(rng) {
    return [
      { note: "two nodes", args: { adjList: [[2], [1]] } },
      { note: "triangle", args: { adjList: [[2, 3], [1, 3], [1, 2]] } },
      { note: "star with centre 1", args: { adjList: [Array.from({ length: 99 }, (_, i) => i + 2), ...Array.from({ length: 99 }, () => [1])] } },
      { note: "path of 100", args: { adjList: Array.from({ length: 100 }, (_, i) => [i, i + 2].filter((v) => v >= 1 && v <= 100)) } },
      { note: "random tree of 100", args: { adjList: graph(rng, 100, 0) } },
      { note: "random graph of 100 with cycles", args: { adjList: graph(rng, 100, 150) } },
      { note: "complete graph of 30", args: { adjList: Array.from({ length: 30 }, (_, i) => Array.from({ length: 30 }, (_, j) => j + 1).filter((v) => v !== i + 1)) } },
    ];
  },

  validate({ adjList }) {
    const n = adjList.length;
    if (n > 100) throw new Error("too many nodes");
    for (let i = 0; i < n; i++) {
      const s = new Set(adjList[i]);
      if (s.size !== adjList[i].length) throw new Error("repeated edge");
      for (const v of adjList[i]) {
        if (v < 1 || v > n || v === i + 1) throw new Error("bad neighbour");
        if (!adjList[v - 1].includes(i + 1)) throw new Error("edge is not symmetric");
      }
    }
    // connected
    if (n) {
      const seen = new Set([1]);
      const stack = [1];
      while (stack.length) for (const v of adjList[stack.pop() - 1]) if (!seen.has(v)) { seen.add(v); stack.push(v); }
      if (seen.size !== n) throw new Error("graph is not connected");
    }
  },
};
