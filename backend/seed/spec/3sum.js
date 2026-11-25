module.exports = {
  slug: "3sum",
  signature: { method: "threeSum", params: [{ name: "nums", type: "int[]" }], returns: "List<List<int>>" },
  // Any order is accepted: the driver sorts each triplet and then the list of triplets.
  post: {
    cpp: "for (auto& oc_t : oc_res) sort(oc_t.begin(), oc_t.end());\nsort(oc_res.begin(), oc_res.end());",
    java: "oc_res = sortLists(oc_res, true);",
  },
  description: `
Given an integer array \`nums\`, find every **triplet of values** \`[a, b, c]\` taken from three **different positions** of the array such that \`a + b + c == 0\`.

Return each such triplet of values **once**: two triplets with the same values (in any order) count as the same triplet, even if they come from different positions. The triplets, and the values inside each, may be returned in any order. Return an empty list if there are none.
`,
  constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
  examples: [
    { explanation: "-3 + 1 + 2, -3 + 0 + 3 and -2 + 0 + 2 all sum to 0. (Printed sorted.)" },
    { explanation: "All values are positive, so no triplet sums to 0." },
    { explanation: "Four zeros give the same triplet [0, 0, 0] many ways, but it is listed once." },
  ],
  notes: "Driver sorts each triplet and the list, so any order is accepted.",
};
