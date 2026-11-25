module.exports = {
  slug: "meeting-rooms",
  signature: { method: "canAttendMeetings", params: [{ name: "intervals", type: "int[][]" }], returns: "bool" },
  description: `
\`intervals[i] = [start, end]\` describes a meeting that runs from time \`start\` until time \`end\`. The list is in no particular order.

Return \`true\` if one person could attend **every** meeting, i.e. no two meetings overlap. A meeting that ends at time \`t\` does **not** clash with one that starts at time \`t\`.
`,
  constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start < end <= 10^6"],
  examples: [
    { explanation: "Sorted by start the meetings are [4,9], [9,10], [13,15]; the first two only touch at 9." },
    { explanation: "[2,3] happens entirely inside [1,4]." },
    { explanation: "With no meetings there is nothing to clash." },
  ],
  notes: "NeetCode's version passes Interval objects; here meetings are int pairs, which keeps the format language-neutral.",
};
