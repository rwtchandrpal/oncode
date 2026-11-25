module.exports = {
  slug: "product-of-array-except-self",
  signature: { method: "productExceptSelf", params: [{ name: "nums", type: "int[]" }], returns: "int[]" },
  description: `
Given an integer array \`nums\`, return an array \`answer\` of the same length where \`answer[i]\` is the product of every element of \`nums\` **except** \`nums[i]\`.

The tests guarantee that the product of any prefix or suffix of \`nums\` fits in a 32-bit signed integer.

Solve it in **O(n)** time **without using division**. (Division also breaks down as soon as \`nums\` contains a zero.)
`,
  constraints: [
    "2 <= nums.length <= 10^5",
    "-30 <= nums[i] <= 30",
    "Every prefix and suffix product of nums fits in a 32-bit signed integer",
  ],
  examples: [
    { explanation: "For index 0: 3 * 4 * 5 = 60. For index 3: 2 * 3 * 4 = 24." },
    { explanation: "Every product that includes the 0 is 0; only index 1 skips it: -2 * 5 * 1 = -10." },
    { explanation: "Each answer is simply the other element." },
  ],
};
