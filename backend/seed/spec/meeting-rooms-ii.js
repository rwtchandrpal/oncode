module.exports = {
  slug: "meeting-rooms-ii",
  signature: { method: "minMeetingRooms", params: [{ name: "intervals", type: "int[][]" }], returns: "int" },
  description: `
\`intervals[i] = [start, end]\` is a meeting from time \`start\` until time \`end\`, in no particular order. Each meeting needs a room for its whole duration, and a room can host only one meeting at a time.

Return the **minimum number of rooms** needed to hold all the meetings. A room freed at time \`t\` can be reused by a meeting that starts at time \`t\`.
`,
  constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start < end <= 10^6"],
  examples: [
    { explanation: "[2,7] and [3,9] overlap, so two rooms. [8,12] can take the room freed at 7." },
    { explanation: "The second meeting starts exactly when the first ends, so one room is enough." },
    { explanation: "All three meetings are running at time 3." },
  ],
  notes: "Meetings are int pairs rather than Interval objects (see meeting-rooms).",
};
