const { designDrivers, designSignature } = require("../tools/lib/design");

const design = {
  className: "Trie",
  argType: "string",
  methods: [
    { name: "insert", params: ["word"], returns: "void" },
    { name: "search", params: ["word"], returns: "bool" },
    { name: "startsWith", params: ["prefix"], returns: "bool" },
  ],
};

module.exports = {
  slug: "implement-trie-prefix-tree",
  signature: designSignature(design),
  drivers: designDrivers(design),
  description: `
A **trie** (prefix tree) stores a set of strings so that both whole words and prefixes can be looked up quickly. Implement the class \`Trie\`:

- \`Trie()\` creates an empty trie.
- \`void insert(word)\` adds \`word\` to the trie.
- \`bool search(word)\` returns \`true\` if \`word\` was inserted before, and \`false\` otherwise.
- \`bool startsWith(prefix)\` returns \`true\` if some inserted word begins with \`prefix\` (a word is a prefix of itself), and \`false\` otherwise.

**Test format:** the input is a list of operation names and a list of their arguments. The judge creates the object with the first operation, calls the methods in order, and prints a list with each call's result (\`null\` for the constructor and for \`insert\`).
`,
  constraints: [
    "1 <= word.length, prefix.length <= 2000",
    "word and prefix consist of lowercase English letters",
    "At most 3 * 10^4 calls in total",
  ],
  examples: [
    { explanation: "\"car\" was inserted, so search(\"car\") is true; \"ca\" is only a prefix, so search(\"ca\") is false but startsWith(\"ca\") is true." },
    { explanation: "Nothing has been inserted, so every lookup is false." },
    { explanation: "After inserting \"ca\", the earlier prefix becomes a full word too." },
  ],
  notes: "Design problem: operations are replayed by the driver (tools/lib/design.js).",
};
