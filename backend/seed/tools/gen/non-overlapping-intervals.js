const { randomIntervals, checkIntervals } = require("./_intervals");

const B = 5e4;

module.exports = {
  samples: [{ intervals: [[1, 5], [2, 3], [4, 6], [7, 8]] }, { intervals: [[0, 4], [0, 4], [0, 4]] }, { intervals: [[1, 2], [2, 3]] }],

  hidden(rng) {
    return [
      { note: "single interval", args: { intervals: [[-B, B]] } },
      { note: "one long interval covering short ones", args: { intervals: [[1, 100], [2, 3], [4, 5], [6, 7]] } },
      { note: "touching chain with negatives, shuffled", args: { intervals: rng.shuffle(rng.array(5000, (i) => [-B + i * 20, -B + i * 20 + 20])) } },
      { note: "nested intervals", args: { intervals: rng.shuffle(rng.array(2000, (i) => [-i - 1, i + 1])) } },
      { note: "large n=12000 random short", args: { intervals: randomIntervals(rng, 12000, -B, B, 30) } },
      { note: "large n=12000 random long", args: { intervals: randomIntervals(rng, 12000, -B, B, 20000) } },
      { note: "n=1000 identical", args: { intervals: rng.array(1000, () => [3, 9]) } },
    ];
  },

  validate({ intervals }) {
    if (intervals.length < 1 || intervals.length > 1e5) throw new Error("interval count out of range");
    checkIntervals(intervals, -B, B, true);
  },
};
