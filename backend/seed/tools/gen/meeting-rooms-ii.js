const { randomIntervals, checkIntervals } = require("./_intervals");

module.exports = {
  samples: [{ intervals: [[2, 7], [3, 9], [8, 12]] }, { intervals: [[5, 8], [8, 11]] }, { intervals: [[1, 10], [2, 9], [3, 8]] }],

  hidden(rng) {
    return [
      { note: "single meeting", args: { intervals: [[0, 1]] } },
      { note: "n=500 identical meetings", args: { intervals: rng.array(500, () => [100, 200]) } },
      { note: "touching chain, shuffled", args: { intervals: rng.shuffle(rng.array(2000, (i) => [i * 10, i * 10 + 10])) } },
      { note: "nested meetings", args: { intervals: rng.shuffle(rng.array(300, (i) => [i, 1000000 - i])) } },
      { note: "large n=10000 random short", args: { intervals: randomIntervals(rng, 10000, 0, 1000000, 2000) } },
      { note: "large n=10000 random long", args: { intervals: randomIntervals(rng, 10000, 0, 1000000, 300000) } },
      { note: "n=1000 in a narrow window", args: { intervals: randomIntervals(rng, 1000, 0, 5000, 50) } },
    ];
  },

  validate({ intervals }) {
    if (intervals.length < 1 || intervals.length > 1e4) throw new Error("interval count out of range");
    checkIntervals(intervals, 0, 1e6, true);
  },
};
