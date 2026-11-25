module.exports = {
  slug: "non-overlapping-intervals",
  signature: { method: "eraseOverlapIntervals", params: [{ name: "intervals", type: "int[][]" }], returns: "int" },
  description: `
Given a list of intervals \`intervals[i] = [start, end]\`, remove as **few** intervals as possible so that none of the remaining ones overlap.

Return the number of intervals you need to remove. Intervals that only touch, such as \`[1, 3]\` and \`[3, 6]\`, do **not** overlap.
`,
  constraints: ["1 <= intervals.length <= 10^5", "intervals[i].length == 2", "-5 * 10^4 <= start < end <= 5 * 10^4"],
  examples: [
    { explanation: "Removing [1,5] leaves [2,3], [4,6], [7,8], which do not overlap." },
    { explanation: "Three copies of the same interval: two must go." },
    { explanation: "The intervals only touch at 2, so nothing has to be removed." },
  ],
};
