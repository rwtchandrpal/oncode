module.exports = {
  slug: "unique-paths",
  signature: {
    method: "uniquePaths",
    params: [
      { name: "m", type: "int" },
      { name: "n", type: "int" },
    ],
    returns: "int",
  },
  description: `
A robot stands in the top-left cell of an \`m x n\` grid (\`m\` rows, \`n\` columns) and wants to reach the bottom-right cell. On each move it can go **one cell down** or **one cell right**, never up or left.

Return the number of different routes the robot can take.

The tests guarantee that the answer is at most \`2 * 10^9\`.
`,
  constraints: ["1 <= m, n <= 100", "The answer is at most 2 * 10^9"],
  examples: [
    { explanation: "Any route makes 2 moves down and 2 moves right; there are 6 ways to order them." },
    { explanation: "1 move down and 3 moves right: the down move can come at any of 4 points." },
    { explanation: "The robot is already at the target, which counts as one (empty) route." },
  ],
};
