module.exports = {
  slug: "group-anagrams",
  signature: { method: "groupAnagrams", params: [{ name: "strs", type: "string[]" }], returns: "List<List<string>>" },
  // Any grouping order is accepted: the driver sorts each group and then the list of groups.
  post: {
    cpp: "for (auto& oc_g : oc_res) sort(oc_g.begin(), oc_g.end());\nsort(oc_res.begin(), oc_res.end());",
    java: "oc_res = sortLists(oc_res, true);",
  },
  description: `
Given an array of strings \`strs\`, put the strings into groups so that two strings are in the same group exactly when they are **anagrams** of each other (one is a rearrangement of the other's letters, with the same count of every letter).

Return the list of groups. Every input string, including repeated ones, appears in exactly one group. The groups, and the strings inside each group, may be in any order.
`,
  constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters"],
  examples: [
    { explanation: "\"listen\", \"silent\" and \"enlist\" use the same letters; \"google\" and \"banana\" are on their own. (Printed sorted.)" },
    { explanation: "Two empty strings are anagrams of each other." },
    { explanation: "\"abc\" and \"bca\" share letters; \"xyz\" does not match them." },
  ],
  notes: "Driver sorts strings within each group and then the groups, so any order is accepted.",
};
