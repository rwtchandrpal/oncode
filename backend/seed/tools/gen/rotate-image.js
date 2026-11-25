const square = (rng, n) => rng.array(n, () => rng.array(n, () => rng.int(-1000, 1000)));
const counting = (n) => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));

module.exports = {
  samples: [{ matrix: [[0, 1, 2], [3, 4, 5], [6, 7, 8]] }, { matrix: [[1, 2], [3, 4]] }, { matrix: [[9]] }],

  hidden(rng) {
    return [
      { note: "4 x 4 counting", args: { matrix: counting(4) } },
      { note: "5 x 5 counting (odd size, fixed centre)", args: { matrix: counting(5) } },
      { note: "2 x 2 negatives", args: { matrix: [[-1000, -1], [1, 1000]] } },
      { note: "6 x 6 random", args: { matrix: square(rng, 6) } },
      { note: "19 x 19 random", args: { matrix: square(rng, 19) } },
      { note: "20 x 20 random", args: { matrix: square(rng, 20) } },
      { note: "20 x 20 all equal", args: { matrix: square(rng, 20).map((r) => r.map(() => 7)) } },
    ];
  },

  validate({ matrix }) {
    const n = matrix.length;
    if (n < 1 || n > 20 || matrix.some((r) => r.length !== n)) throw new Error("not a square matrix of size 1..20");
    if (matrix.flat().some((v) => v < -1000 || v > 1000)) throw new Error("value out of range");
  },
};
