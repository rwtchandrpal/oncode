module.exports = {
  slug: "jump-game",
  signature: { method: "canJump", params: [{ name: "nums", type: "int[]" }], returns: "bool" },
  description: `
You start on the first index of the array \`nums\`. The value \`nums[i]\` is the **farthest** you may jump forward from index \`i\`: from there you can move to any index from \`i + 1\` up to \`i + nums[i]\`.

Return \`true\` if you can reach the last index, and \`false\` otherwise.
`,
  constraints: ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^5"],
  examples: [
    { explanation: "Jump 0 -> 1, then from index 1 jump 2 steps to index 3, then 1 step to index 4." },
    { explanation: "Every route lands on index 2, whose value is 0, so index 3 is out of reach." },
    { explanation: "You already stand on the last index." },
  ],
};
