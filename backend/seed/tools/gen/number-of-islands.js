const toGrid = (rows) => rows.map((r) => r.split(""));
const random = (rng, m, n, landRate) => rng.array(m, () => rng.array(n, () => (rng.next() < landRate ? "1" : "0")));

// A single snake-shaped island filling every other row (long DFS chains).
const snake = (m, n) =>
  Array.from({ length: m }, (_, r) =>
    Array.from({ length: n }, (_, c) => (r % 2 === 0 || (r % 4 === 1 ? c === n - 1 : c === 0) ? "1" : "0"))
  );

module.exports = {
  samples: [
    { grid: toGrid(["11000", "11000", "00100", "00011"]) },
    { grid: toGrid(["101", "010", "101"]) },
    { grid: toGrid(["0"]) },
  ],

  hidden(rng) {
    return [
      { note: "single land cell", args: { grid: toGrid(["1"]) } },
      { note: "one row with gaps", args: { grid: toGrid(["1011011101"]) } },
      { note: "checkerboard 20x20", args: { grid: Array.from({ length: 20 }, (_, r) => Array.from({ length: 20 }, (_, c) => ((r + c) % 2 ? "0" : "1"))) } },
      { note: "100x100 all land", args: { grid: random(rng, 100, 100, 1) } },
      { note: "snake island 100x100", args: { grid: snake(100, 100) } },
      { note: "150x150 random, 45% land", args: { grid: random(rng, 150, 150, 0.45) } },
      { note: "150x150 random, 60% land", args: { grid: random(rng, 150, 150, 0.6) } },
    ];
  },

  validate({ grid }) {
    const m = grid.length;
    if (m < 1 || m > 300) throw new Error("rows out of range");
    const n = grid[0].length;
    if (n < 1 || n > 300 || grid.some((r) => r.length !== n)) throw new Error("bad column count");
    if (!grid.flat().every((v) => v === "0" || v === "1")) throw new Error("bad cell");
  },
};
