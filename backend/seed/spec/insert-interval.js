module.exports = {
  slug: "insert-interval",
  signature: {
    method: "insert",
    params: [
      { name: "intervals", type: "int[][]" },
      { name: "newInterval", type: "int[]" },
    ],
    returns: "int[][]",
  },
  description: `
\`intervals\` is a list of non-overlapping intervals \`[start, end]\`, sorted by \`start\`. Insert \`newInterval = [start, end]\` into it, merging it with every interval it overlaps, so that the result is again sorted and non-overlapping.

Intervals that share an endpoint overlap: inserting \`[4, 6]\` next to \`[1, 4]\` produces \`[1, 6]\`.

Return the resulting list, sorted by \`start\`.
`,
  constraints: [
    "0 <= intervals.length <= 10^4",
    "intervals[i].length == 2 and newInterval.length == 2",
    "0 <= start <= end <= 10^5",
    "intervals is sorted by start and its intervals do not overlap",
  ],
  examples: [
    { explanation: "[6,10] overlaps [5,7] and [9,12]; together they become [5,12]." },
    { explanation: "Inserting into an empty list." },
    { explanation: "[6,7] does not touch [3,5], so it is simply added after it." },
  ],
};
