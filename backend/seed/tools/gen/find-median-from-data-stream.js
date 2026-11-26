const { ops, checkOps } = require("./_design");

const B = 1e5;

// addNum calls with values from `value()`, asking for the median every `every` additions.
const stream = (rng, adds, every, value) => {
  const list = [];
  for (let i = 1; i <= adds; i++) {
    list.push(["addNum", value(i)]);
    if (i % every === 0 || rng.next() < 0.05) list.push(["findMedian"]);
  }
  list.push(["findMedian"]);
  return ops("MedianFinder", list);
};

module.exports = {
  samples: [
    ops("MedianFinder", [["addNum", 1], ["addNum", 2], ["findMedian"], ["addNum", 3], ["findMedian"]]),
    ops("MedianFinder", [["addNum", -7], ["findMedian"]]),
    ops("MedianFinder", [["addNum", 6], ["addNum", -1], ["addNum", 10], ["addNum", -4], ["findMedian"]]),
  ],

  hidden(rng) {
    return [
      { note: "extremes", args: ops("MedianFinder", [["addNum", -B], ["addNum", B], ["findMedian"], ["addNum", B], ["findMedian"]]) },
      { note: "negative half (-0.5)", args: ops("MedianFinder", [["addNum", -1], ["addNum", 0], ["findMedian"]]) },
      { note: "repeated values", args: stream(rng, 200, 3, () => rng.int(-2, 2)) },
      { note: "2000 random adds", args: stream(rng, 2000, 10, () => rng.int(-B, B)) },
      { note: "6000 increasing adds", args: stream(rng, 6000, 7, (i) => i * 15 - B) },
      { note: "6000 decreasing adds", args: stream(rng, 6000, 7, (i) => B - i * 15) },
      { note: "7000 random adds, median every time", args: stream(rng, 3500, 1, () => rng.int(-B, B)) },
    ];
  },

  validate(args) {
    checkOps(args, "MedianFinder", { addNum: 1, findMedian: 0 }, 5e4);
    let count = 0;
    args.operations.forEach((op, i) => {
      if (op === "addNum") {
        const v = args.arguments[i][0];
        if (v < -B || v > B) throw new Error("num out of range");
        count++;
      }
      if (op === "findMedian" && count === 0) throw new Error("findMedian before any addNum");
    });
  },
};
