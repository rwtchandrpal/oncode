const { disjointSorted, checkIntervals } = require("./_intervals");

const B = 1e5;

module.exports = {
  samples: [
    { intervals: [[1, 2], [5, 7], [9, 12]], newInterval: [6, 10] },
    { intervals: [], newInterval: [4, 8] },
    { intervals: [[3, 5]], newInterval: [6, 7] },
  ],

  hidden(rng) {
    const many = disjointSorted(rng, 10000, 0, 4, 5);
    return [
      { note: "before everything", args: { intervals: [[5, 6], [8, 9]], newInterval: [0, 1] } },
      { note: "after everything", args: { intervals: [[5, 6], [8, 9]], newInterval: [20, 30] } },
      { note: "covers everything", args: { intervals: [[5, 6], [8, 9], [11, 15]], newInterval: [0, B] } },
      { note: "touches endpoints on both sides", args: { intervals: [[1, 4], [6, 9]], newInterval: [4, 6] } },
      { note: "point inside an existing interval", args: { intervals: [[1, 10]], newInterval: [5, 5] } },
      { note: "large n=10000, merges a block in the middle", args: { intervals: many, newInterval: [many[4000][0] + 1, many[4100][1] - 1] } },
      { note: "large n=10000, point just after an interval", args: { intervals: many, newInterval: [many[7000][1] + 1, many[7000][1] + 1] } },
    ];
  },

  validate({ intervals, newInterval }) {
    if (intervals.length > 1e4) throw new Error("too many intervals");
    checkIntervals([...intervals, newInterval], 0, B, false);
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i][0] <= intervals[i - 1][1]) throw new Error("intervals overlap or are unsorted");
    }
  },
};
