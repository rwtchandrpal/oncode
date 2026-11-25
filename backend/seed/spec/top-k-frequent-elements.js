module.exports = {
  slug: "top-k-frequent-elements",
  signature: {
    method: "topKFrequent",
    params: [
      { name: "nums", type: "int[]" },
      { name: "k", type: "int" },
    ],
    returns: "int[]",
  },
  // Any order is accepted: the driver sorts the returned values.
  post: {
    cpp: "sort(oc_res.begin(), oc_res.end());",
    java: "Arrays.sort(oc_res);",
  },
  description: `
Given an integer array \`nums\` and an integer \`k\`, return the \`k\` values that occur **most often** in \`nums\`.

The tests guarantee the answer is unique: the \`k\`-th most frequent value occurs strictly more often than every value outside the answer. The values may be returned in any order.

**Follow-up:** sorting all values by frequency takes O(n log n). Can you do better?
`,
  constraints: [
    "1 <= nums.length <= 10^5",
    "-10^4 <= nums[i] <= 10^4",
    "1 <= k <= number of distinct values in nums",
    "The set of the k most frequent values is unique",
  ],
  examples: [
    { explanation: "4 occurs three times and 6 twice; 9 and 1 occur once." },
    { explanation: "The only value." },
    { explanation: "5 occurs three times and -2 twice. (Printed in sorted order.)" },
  ],
  notes: "Driver sorts the returned values, so any order is accepted.",
};
