const { designDrivers, designSignature } = require("../tools/lib/design");

const design = {
  className: "WordDictionary",
  argType: "string",
  methods: [
    { name: "addWord", params: ["word"], returns: "void" },
    { name: "search", params: ["word"], returns: "bool" },
  ],
};

module.exports = {
  slug: "design-add-and-search-words-data-structure",
  signature: designSignature(design),
  drivers: designDrivers(design),
  description: `
Design a dictionary that stores words and answers searches in which a dot \`.\` stands for **any single letter**. Implement the class \`WordDictionary\`:

- \`WordDictionary()\` creates an empty dictionary.
- \`void addWord(word)\` stores \`word\`.
- \`bool search(word)\` returns \`true\` if some stored word matches \`word\` letter for letter, where each \`.\` matches any one letter. The match must cover the whole word (same length).

**Test format:** the input lists operation names and their arguments. The judge replays them in order and prints each call's result (\`null\` for the constructor and \`addWord\`).
`,
  constraints: [
    "1 <= word.length <= 25",
    "Words passed to addWord contain only lowercase English letters",
    "Words passed to search contain lowercase letters or '.'",
    "Each search contains at most 2 dots",
    "At most 10^4 calls in total",
  ],
  examples: [
    { explanation: "\"b.d\" matches \"bad\", \".ad\" matches both stored words, and \"ba\" is shorter than every stored word." },
    { explanation: "An empty dictionary matches nothing, not even a single dot." },
    { explanation: "A dot matches exactly one letter: \"c.\" is one letter short of \"cat\", while \"c.t\" matches it." },
  ],
  notes: "Design problem: operations are replayed by the driver (tools/lib/design.js).",
};
