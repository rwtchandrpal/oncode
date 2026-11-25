const { disjointSorted, randomIntervals, checkIntervals } = require("./_intervals");

module.exports = {
  samples: [{ intervals: [[9, 10], [4, 9], [13, 15]] }, { intervals: [[1, 4], [2, 3]] }, { intervals: [] }],

  hidden(rng) {
    const free = disjointSorted(rng, 10000, 0, 50, 50).map(([a, b]) => [a, b + 1]);
    const touching = rng.array(10000, (i) => [i * 100, i * 100 + 100]);
    const clash = free.map((x) => x.slice());
    clash[7777][1] = clash[7778][0] + 1; // stretches into the next meeting
    return [
      { note: "single meeting", args: { intervals: [[0, 1000000]] } },
      { note: "identical meetings", args: { intervals: [[5, 8], [5, 8]] } },
      { note: "n=3 random", args: { intervals: randomIntervals(rng, 3, 0, 1000000, 400000) } },
      { note: "large n=10000 disjoint, shuffled", args: { intervals: rng.shuffle(free.map((x) => x.slice())) } },
      { note: "large n=10000 touching chain, shuffled", args: { intervals: rng.shuffle(touching) } },
      { note: "large n=10000 one overlap, shuffled", args: { intervals: rng.shuffle(clash) } },
      { note: "n=1000 random, overlaps likely", args: { intervals: randomIntervals(rng, 1000, 0, 1000000, 5000) } },
    ];
  },

  validate({ intervals }) {
    if (intervals.length > 1e4) throw new Error("too many intervals");
    checkIntervals(intervals, 0, 1e6, true);
  },
};
