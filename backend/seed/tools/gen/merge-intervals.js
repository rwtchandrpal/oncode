const { randomIntervals, checkIntervals } = require("./_intervals");

const B = 1e4;

module.exports = {
  samples: [{ intervals: [[8, 12], [1, 4], [3, 6], [13, 14]] }, { intervals: [[1, 5], [5, 7]] }, { intervals: [[4, 4]] }],

  hidden(rng) {
    return [
      { note: "full range", args: { intervals: [[0, B]] } },
      { note: "all nested inside one", args: { intervals: rng.shuffle([[0, 1000], ...randomIntervals(rng, 50, 1, 999, 100, true)]) } },
      { note: "disjoint, unsorted", args: { intervals: rng.shuffle(rng.array(100, (i) => [i * 10, i * 10 + 5])) } },
      { note: "touching chain, shuffled", args: { intervals: rng.shuffle(rng.array(1000, (i) => [i * 10, i * 10 + 10])) } },
      { note: "point intervals with duplicates", args: { intervals: rng.array(200, () => { const p = rng.int(0, 100); return [p, p]; }) } },
      { note: "large n=10000 random short", args: { intervals: randomIntervals(rng, 10000, 0, B, 3, true) } },
      { note: "large n=10000 random sparse", args: { intervals: randomIntervals(rng, 10000, 0, B, 1, true) } },
    ];
  },

  validate({ intervals }) {
    if (intervals.length < 1 || intervals.length > 1e4) throw new Error("interval count out of range");
    checkIntervals(intervals, 0, B, false);
  },
};
