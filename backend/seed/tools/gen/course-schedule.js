// Random DAG edges [a, b] (b before a) consistent with a hidden topological order.
const randomDag = (rng, n, count) => {
  const order = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const seen = new Set();
  const edges = [];
  while (edges.length < count) {
    const i = rng.int(0, n - 1), j = rng.int(0, n - 1);
    if (i === j) continue;
    const [b, a] = i < j ? [order[i], order[j]] : [order[j], order[i]];
    if (seen.has(`${a},${b}`)) continue;
    seen.add(`${a},${b}`);
    edges.push([a, b]);
  }
  return edges;
};

module.exports = {
  samples: [
    { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] },
    { numCourses: 4, prerequisites: [[1, 2], [2, 3], [3, 1]] },
    { numCourses: 1, prerequisites: [] },
  ],

  hidden(rng) {
    const chain = Array.from({ length: 1999 }, (_, i) => [i + 1, i]);
    const dag = randomDag(rng, 2000, 5000);
    const cyclic = dag.slice(0, 4999);
    // one back edge closing a long path: course 0 now needs the last course of the chain
    return [
      { note: "two courses requiring each other", args: { numCourses: 2, prerequisites: [[0, 1], [1, 0]] } },
      { note: "no prerequisites", args: { numCourses: 2000, prerequisites: [] } },
      { note: "chain of 2000", args: { numCourses: 2000, prerequisites: rng.shuffle(chain.map((e) => e.slice())) } },
      { note: "chain of 2000 closed into a loop", args: { numCourses: 2000, prerequisites: rng.shuffle([...chain.map((e) => e.slice()), [0, 1999]]) } },
      { note: "random DAG, 2000 courses, 5000 edges", args: { numCourses: 2000, prerequisites: dag } },
      { note: "random DAG plus a back edge", args: { numCourses: 2000, prerequisites: rng.shuffle([...cyclic, [cyclic[0][1], cyclic[0][0]]]) } },
      { note: "diamond-shaped dependencies", args: { numCourses: 6, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3], [5, 3], [5, 4]] } },
    ];
  },

  validate({ numCourses, prerequisites }) {
    if (numCourses < 1 || numCourses > 2000) throw new Error("numCourses out of range");
    if (prerequisites.length > 5000) throw new Error("too many prerequisites");
    const seen = new Set();
    for (const e of prerequisites) {
      const [a, b] = e;
      if (e.length !== 2 || a < 0 || b < 0 || a >= numCourses || b >= numCourses || a === b) throw new Error("bad pair");
      if (seen.has(`${a},${b}`)) throw new Error("duplicate pair");
      seen.add(`${a},${b}`);
    }
  },
};
