module.exports = {
  slug: "container-with-most-water",
  signature: { method: "maxArea", params: [{ name: "height", type: "int[]" }], returns: "int" },
  description: `
You are given an array \`height\` of length \`n\`. Picture \`n\` vertical walls standing at positions \`0, 1, ..., n - 1\` on the x-axis, where wall \`i\` is \`height[i]\` units tall.

Pick **two** walls. Together with the x-axis they form a container, and the water it holds is limited by the **shorter** wall: the amount is \`min(height[i], height[j]) * (j - i)\`. Walls between the two chosen ones do not get in the way.

Return the largest amount of water any pair of walls can hold.
`,
  constraints: ["2 <= height.length <= 10^5", "0 <= height[i] <= 10^4"],
  examples: [
    { explanation: "Walls 0 and 4 hold min(3, 5) * 4 = 12. No other pair holds more." },
    { explanation: "The only pair holds min(1, 1) * 1 = 1." },
    { explanation: "The two walls of height 9 are 3 apart: 9 * 3 = 27." },
  ],
};
