// Shared helpers for graph generators (not a problem generator itself).

// Random spanning tree on nodes 0..n-1 as an edge list [a, b].
const randomTree = (rng, n) => {
  const order = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const edges = [];
  for (let i = 1; i < n; i++) edges.push(rng.shuffle([order[i], order[rng.int(0, i - 1)]]));
  return rng.shuffle(edges);
};

// Random simple undirected edges (no self loops, no duplicates in either direction).
const randomEdges = (rng, n, count, exclude = []) => {
  const key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
  const seen = new Set(exclude.map(([a, b]) => key(a, b)));
  const edges = [];
  while (edges.length < count) {
    const a = rng.int(0, n - 1), b = rng.int(0, n - 1);
    if (a === b || seen.has(key(a, b))) continue;
    seen.add(key(a, b));
    edges.push([a, b]);
  }
  return edges;
};

const checkUndirected = (n, edges) => {
  const seen = new Set();
  for (const e of edges) {
    if (!Array.isArray(e) || e.length !== 2) throw new Error("each edge needs 2 nodes");
    const [a, b] = e;
    if (a < 0 || b < 0 || a >= n || b >= n) throw new Error("node out of range");
    if (a === b) throw new Error("self loop");
    const k = a < b ? `${a},${b}` : `${b},${a}`;
    if (seen.has(k)) throw new Error("duplicate edge");
    seen.add(k);
  }
};

// Connected components count with union-find.
const components = (n, edges) => {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let count = n;
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) { parent[ra] = rb; count--; }
  }
  return count;
};

module.exports = { randomTree, randomEdges, checkUndirected, components };
