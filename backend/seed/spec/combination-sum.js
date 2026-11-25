module.exports = {
  slug: "combination-sum",
  signature: {
    method: "combinationSum",
    params: [
      { name: "candidates", type: "int[]" },
      { name: "target", type: "int" },
    ],
    returns: "List<List<int>>",
  },
  // Any order is accepted: the driver sorts each combination and then the list.
  post: {
    cpp: "for (auto& oc_c : oc_res) sort(oc_c.begin(), oc_c.end());\nsort(oc_res.begin(), oc_res.end());",
    java: "oc_res = sortLists(oc_res, true);",
  },
  description: `
You are given an array of **distinct** positive integers \`candidates\` and a positive integer \`target\`. Find every combination of candidates whose sum is exactly \`target\`. **Each candidate may be used any number of times.**

Two combinations are the same if they use the same numbers the same number of times, regardless of order, so each must be listed once. Return the combinations in any order (the numbers inside a combination may also be in any order), or an empty list if there are none.

The tests guarantee fewer than 150 combinations.
`,
  constraints: [
    "1 <= candidates.length <= 30",
    "2 <= candidates[i] <= 40",
    "All candidates are distinct",
    "1 <= target <= 40",
    "There are fewer than 150 combinations",
  ],
  examples: [
    { explanation: "2+2+2+2, 2+3+3 and 3+5 all make 8." },
    { explanation: "1 cannot be made from 2s." },
    { explanation: "Only 4 + 9 works." },
  ],
  notes: "Driver sorts inside each combination and then the list, so any order is accepted.",
};
