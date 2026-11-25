module.exports = {
  slug: "valid-parentheses",
  signature: { method: "isValid", params: [{ name: "s", type: "string" }], returns: "bool" },
  description: `
The string \`s\` contains only the bracket characters \`(\`, \`)\`, \`[\`, \`]\`, \`{\` and \`}\`.

It is **valid** when:

- every opening bracket is closed by a closing bracket of the **same type**,
- brackets are closed in the **reverse order** they were opened (the most recently opened one closes first), and
- every closing bracket has a matching opening bracket before it.

Return \`true\` if \`s\` is valid, and \`false\` otherwise.
`,
  constraints: ["1 <= s.length <= 10^5", "s consists only of the characters ()[]{}"],
  examples: [
    { explanation: "Each pair is closed by the same type, innermost first." },
    { explanation: "The ( is opened before the [, so ) cannot close it while [ is still open." },
    { explanation: "Neither opening bracket is ever closed." },
  ],
};
