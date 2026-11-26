const B = 1e4;
const sorted = (rng, n, lo, hi) => rng.array(n, () => rng.int(lo, hi)).sort((a, b) => a - b);

module.exports = {
  samples: [{ lists: [[2, 6, 9], [1, 7], [3, 4, 8]] }, { lists: [] }, { lists: [[]] }],

  hidden(rng) {
    return [
      { note: "one list", args: { lists: [[-B, 0, B]] } },
      { note: "several empty lists and one value", args: { lists: [[], [], [5], []] } },
      { note: "duplicates across lists", args: { lists: [[1, 1, 2], [1, 2, 2], [2, 3]] } },
      { note: "k=100 lists of 100", args: { lists: rng.array(100, () => sorted(rng, 100, -B, B)) } },
      { note: "k=10000 single-node lists", args: { lists: rng.array(10000, () => [rng.int(-999, 999)]) } },
      { note: "k=20 lists of 500", args: { lists: rng.array(20, () => sorted(rng, 500, -B, B)) } },
      { note: "k=2000 lists of mixed sizes", args: { lists: rng.array(2000, () => sorted(rng, rng.int(0, 9), -B, B)) } },
    ];
  },

  validate({ lists }) {
    if (lists.length > 1e4) throw new Error("too many lists");
    let total = 0;
    for (const l of lists) {
      if (l.length > 500) throw new Error("list too long");
      total += l.length;
      if (l.some((v) => v < -B || v > B)) throw new Error("value out of range");
      for (let i = 1; i < l.length; i++) if (l[i] < l[i - 1]) throw new Error("list not sorted");
    }
    if (total > 1e4) throw new Error("too many nodes in total");
  },
};
