const random = (rng, m, n, max) => rng.array(m, () => rng.array(n, () => rng.int(0, max)));

module.exports = {
  samples: [
    { heights: [[1, 2, 3], [4, 5, 2], [3, 1, 1]] },
    { heights: [[7]] },
    { heights: [[2, 2], [2, 2]] },
  ],

  hidden(rng) {
    return [
      { note: "single row", args: { heights: [[5, 3, 4, 1, 2]] } },
      { note: "single column", args: { heights: [[1], [9], [2], [3]] } },
      { note: "max heights in a ridge", args: { heights: [[0, 100000, 0], [0, 100000, 0], [0, 100000, 0]] } },
      { note: "20x20 random", args: { heights: random(rng, 20, 20, 10) } },
      { note: "150x150 random 0..999", args: { heights: random(rng, 150, 150, 999) } },
      { note: "60x60 flat", args: { heights: random(rng, 60, 60, 0) } },
      { note: "150x150 smooth slope with noise", args: { heights: rng.array(150, (r) => rng.array(150, (c) => Math.max(0, 300 - r - c + rng.int(0, 3)))) } },
    ];
  },

  validate({ heights }) {
    const m = heights.length;
    if (m < 1 || m > 200) throw new Error("rows out of range");
    const n = heights[0].length;
    if (n < 1 || n > 200 || heights.some((r) => r.length !== n)) throw new Error("bad column count");
    if (heights.flat().some((v) => v < 0 || v > 1e5)) throw new Error("height out of range");
  },
};
