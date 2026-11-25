module.exports = {
  slug: "climbing-stairs",
  signature: { method: "climbStairs", params: [{ name: "n", type: "int" }], returns: "int" },
  description: `
A staircase has \`n\` steps. With each move you climb either **1 step or 2 steps**.

Return the number of different sequences of moves that take you from the bottom to exactly the top.
`,
  constraints: ["1 <= n <= 45"],
  examples: [
    { explanation: "Two ways: 1 + 1, or 2." },
    { explanation: "Three ways: 1 + 1 + 1, 1 + 2, or 2 + 1." },
    { explanation: "Eight different sequences of 1s and 2s add up to 5." },
  ],
};
