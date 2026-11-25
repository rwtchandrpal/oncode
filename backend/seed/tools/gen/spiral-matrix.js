const grid = (rng, m, n) => rng.array(m, () => rng.array(n, () => rng.int(-100, 100)));
const counting = (m, n) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));

module.exports = {
  samples: [{ matrix: [[1, 2, 3, 4], [5, 6, 7, 8]] }, { matrix: [[7]] }, { matrix: [[1], [2], [3]] }],

  hidden(rng) {
    return [
      { note: "1 x 10", args: { matrix: grid(rng, 1, 10) } },
      { note: "10 x 1", args: { matrix: grid(rng, 10, 1) } },
      { note: "2 x 2", args: { matrix: counting(2, 2) } },
      { note: "3 x 3", args: { matrix: counting(3, 3) } },
      { note: "4 x 7", args: { matrix: counting(4, 7) } },
      { note: "10 x 9 random", args: { matrix: grid(rng, 10, 9) } },
      { note: "10 x 10 random", args: { matrix: grid(rng, 10, 10) } },
    ];
  },

  validate({ matrix }) {
    const m = matrix.length;
    if (m < 1 || m > 10) throw new Error("rows out of range");
    const n = matrix[0].length;
    if (n < 1 || n > 10 || matrix.some((r) => r.length !== n)) throw new Error("bad column count");
    if (matrix.flat().some((v) => v < -100 || v > 100)) throw new Error("value out of range");
  },
};
