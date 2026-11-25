const MIN = -2147483648;
const MAX = 2147483647;

// Small non-zero values (to keep 200 x 200 inputs under 200 KB) with `zeros` zeros placed at random.
const withZeros = (rng, m, n, zeros) => {
  const g = rng.array(m, () => rng.array(n, () => rng.int(1, 9)));
  for (let k = 0; k < zeros; k++) g[rng.int(0, m - 1)][rng.int(0, n - 1)] = 0;
  return g;
};

module.exports = {
  samples: [{ matrix: [[5, 0, 7], [1, 2, 3]] }, { matrix: [[0, 1], [1, 1]] }, { matrix: [[4]] }],

  hidden(rng) {
    return [
      { note: "single zero", args: { matrix: [[0]] } },
      { note: "int min and max values", args: { matrix: [[MIN, MAX, 1], [MAX, 0, MIN], [1, MIN, MAX]] } },
      { note: "zeros in first row and column (O(1)-space trap)", args: { matrix: [[1, 0, 3, 4], [5, 6, 7, 8], [0, 10, 11, 12], [13, 14, 15, 16]] } },
      { note: "all zeros", args: { matrix: [[0, 0, 0], [0, 0, 0]] } },
      { note: "1 x 200 row with one zero", args: { matrix: withZeros(rng, 1, 200, 1) } },
      { note: "200 x 200, 5 zeros", args: { matrix: withZeros(rng, 200, 200, 5) } },
      { note: "200 x 150, no zeros", args: { matrix: withZeros(rng, 200, 150, 0) } },
    ];
  },

  validate({ matrix }) {
    const m = matrix.length;
    if (m < 1 || m > 200) throw new Error("rows out of range");
    const n = matrix[0].length;
    if (n < 1 || n > 200 || matrix.some((r) => r.length !== n)) throw new Error("bad column count");
  },
};
