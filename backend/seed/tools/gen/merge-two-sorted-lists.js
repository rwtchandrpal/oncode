const sorted = (rng, n, lo, hi) => rng.array(n, () => rng.int(lo, hi)).sort((a, b) => a - b);

module.exports = {
  samples: [
    { list1: [2, 5, 9], list2: [1, 5, 6] },
    { list1: [], list2: [] },
    { list1: [], list2: [0] },
  ],

  hidden(rng) {
    const same = sorted(rng, 50, -100, 100);
    return [
      { note: "second list empty", args: { list1: [5], list2: [] } },
      { note: "identical lists", args: { list1: same, list2: same.slice() } },
      { note: "all of list1 before list2", args: { list1: sorted(rng, 50, -100, -1), list2: sorted(rng, 50, 0, 100) } },
      { note: "all of list2 before list1", args: { list1: sorted(rng, 30, 50, 100), list2: sorted(rng, 40, -100, 49) } },
      { note: "50 + 50 interleaved", args: { list1: sorted(rng, 50, -100, 100), list2: sorted(rng, 50, -100, 100) } },
      { note: "many duplicates", args: { list1: sorted(rng, 50, 0, 2), list2: sorted(rng, 45, 1, 3) } },
      { note: "single nodes, equal", args: { list1: [-100], list2: [-100] } },
    ];
  },

  validate({ list1, list2 }) {
    for (const l of [list1, list2]) {
      if (l.length > 50) throw new Error("list too long");
      if (l.some((v) => v < -100 || v > 100)) throw new Error("value out of range");
      for (let i = 1; i < l.length; i++) if (l[i] < l[i - 1]) throw new Error("list not sorted");
    }
  },
};
