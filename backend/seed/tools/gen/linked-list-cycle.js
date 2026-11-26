const B = 1e5;

module.exports = {
  samples: [
    { head: [7, 1, 9, 3], pos: 2 },
    { head: [5, 6], pos: -1 },
    { head: [8], pos: 0 },
  ],

  hidden(rng) {
    const big = () => rng.array(10000, () => rng.int(-B, B));
    return [
      { note: "empty list", args: { head: [], pos: -1 } },
      { note: "single node, no cycle", args: { head: [1], pos: -1 } },
      { note: "equal values, no cycle (value-based detection trap)", args: { head: rng.array(1000, () => 4), pos: -1 } },
      { note: "n=10000, no cycle", args: { head: big(), pos: -1 } },
      { note: "n=10000, tail links to head", args: { head: big(), pos: 0 } },
      { note: "n=10000, tail links to itself", args: { head: big(), pos: 9999 } },
      { note: "n=10000, cycle into the middle", args: { head: big(), pos: 5000 } },
    ];
  },

  validate({ head, pos }) {
    if (head.length > 1e4) throw new Error("too many nodes");
    if (head.some((v) => v < -B || v > B)) throw new Error("value out of range");
    if (pos !== -1 && (pos < 0 || pos >= head.length)) throw new Error("pos must be -1 or a valid index");
  },
};
