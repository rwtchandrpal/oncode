module.exports = {
  slug: "find-minimum-in-rotated-sorted-array",
  signature: { method: "findMin", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
An array of **distinct** integers was sorted in increasing order and then **rotated**: some number of elements were moved, in order, from the front to the back. For example, \`[1, 3, 5, 8, 9]\` rotated by 3 becomes \`[8, 9, 1, 3, 5]\`. A rotation by \`0\` (or by the full length) leaves the array sorted.

Given the rotated array \`nums\`, return its **smallest** element.

Your solution should run in **O(log n)** time.
`,
  constraints: ["1 <= nums.length <= 10^5", "-10^6 <= nums[i] <= 10^6", "All values in nums are distinct", "nums is a sorted array rotated by some amount"],
  examples: [
    { explanation: "The original array was [1, 3, 5, 8, 9]; the minimum 1 now sits at index 3." },
    { explanation: "The array is not rotated at all, so the minimum is the first element." },
    { explanation: "[-2, 7] rotated by one: the minimum is at the end." },
  ],
  notes: "O(log n) is stated but not enforceable at this input size (a linear scan also passes).",
};
