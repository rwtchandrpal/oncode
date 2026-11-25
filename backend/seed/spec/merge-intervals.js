module.exports = {
  slug: "merge-intervals",
  signature: { method: "merge", params: [{ name: "intervals", type: "int[][]" }], returns: "int[][]" },
  // Any order of the merged intervals is accepted: the driver sorts them before printing.
  post: {
    cpp: "sort(oc_res.begin(), oc_res.end());",
    java: "oc_res = sortRows(oc_res);",
  },
  description: `
Given a list of intervals \`intervals[i] = [start, end]\` in no particular order, merge every group of intervals that overlap into one interval covering the whole group.

Two intervals overlap when they share at least one point, so \`[1, 4]\` and \`[4, 6]\` merge into \`[1, 6]\`.

Return the merged, non-overlapping intervals. They may be returned in any order.
`,
  constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start <= end <= 10^4"],
  examples: [
    { explanation: "[1,4] and [3,6] overlap and become [1,6]. [8,12] and [13,14] stay as they are." },
    { explanation: "The two intervals share the point 5." },
    { explanation: "A single point interval is returned unchanged." },
  ],
  notes: "Driver sorts the returned intervals, so any order is accepted.",
};
