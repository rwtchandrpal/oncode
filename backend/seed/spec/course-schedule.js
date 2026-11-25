module.exports = {
  slug: "course-schedule",
  signature: {
    method: "canFinish",
    params: [
      { name: "numCourses", type: "int" },
      { name: "prerequisites", type: "int[][]" },
    ],
    returns: "bool",
  },
  description: `
There are \`numCourses\` courses, numbered \`0\` to \`numCourses - 1\`. Each entry \`prerequisites[i] = [a, b]\` means course \`b\` must be completed **before** course \`a\` can be taken.

Return \`true\` if there is an order in which all the courses can be completed, and \`false\` if the requirements make that impossible (some courses depend on each other in a loop).
`,
  constraints: [
    "1 <= numCourses <= 2000",
    "0 <= prerequisites.length <= 5000",
    "prerequisites[i].length == 2, 0 <= a, b < numCourses, a != b",
    "All pairs [a, b] are distinct",
  ],
  examples: [
    { explanation: "Take 0, then 1 and 2, then 3." },
    { explanation: "1 needs 2, 2 needs 3 and 3 needs 1: a loop, so none of them can start." },
    { explanation: "A single course with no requirements." },
  ],
};
