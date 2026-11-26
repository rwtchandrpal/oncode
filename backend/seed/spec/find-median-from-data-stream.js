const { designDrivers, designSignature } = require("../tools/lib/design");

const design = {
  className: "MedianFinder",
  argType: "int",
  methods: [
    { name: "addNum", params: ["num"], returns: "void" },
    { name: "findMedian", params: [], returns: "double" },
  ],
};

module.exports = {
  slug: "find-median-from-data-stream",
  signature: designSignature(design),
  drivers: designDrivers(design),
  description: `
The **median** of a list of numbers is the middle value once the list is sorted. If the list has an even length, it is the average of the two middle values: the median of \`[2, 3, 4]\` is \`3\`, and the median of \`[2, 3]\` is \`2.5\`.

Implement the class \`MedianFinder\`, which receives numbers one at a time:

- \`MedianFinder()\` creates an empty finder.
- \`void addNum(num)\` adds the integer \`num\`.
- \`double findMedian()\` returns the median of all numbers added so far.

**Test format:** the input lists operation names and their arguments. The judge replays them in order and prints each call's result: \`null\` for the constructor and \`addNum\`, and the median written with one decimal place (for example \`2.5\` or \`3.0\`).

**Follow-up:** aim for O(log n) per \`addNum\` and O(1) per \`findMedian\`.
`,
  constraints: [
    "-10^5 <= num <= 10^5",
    "findMedian is only called after at least one addNum",
    "At most 5 * 10^4 calls in total",
  ],
  examples: [
    { explanation: "After 1 and 2 the median is (1 + 2) / 2 = 1.5; after adding 3 it is 2." },
    { explanation: "With a single number, the median is that number." },
    { explanation: "Sorted: -4, -1, 6, 10. The two middle values average to (-1 + 6) / 2 = 2.5." },
  ],
  notes: "Design problem; medians are printed with one decimal (they are always multiples of 0.5).",
};
