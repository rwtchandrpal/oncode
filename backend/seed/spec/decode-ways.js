module.exports = {
  slug: "decode-ways",
  signature: { method: "numDecodings", params: [{ name: "s", type: "string" }], returns: "int" },
  description: `
A message of capital letters was encoded by replacing each letter with its position in the alphabet: \`A -> "1"\`, \`B -> "2"\`, ..., \`Z -> "26"\`, and the numbers were written one after another with no separators.

Given the digit string \`s\`, return how many different letter messages could have produced it.

Each letter's code must be a number from \`1\` to \`26\` **written without a leading zero**: \`"06"\` is not a code for F, and a \`"0"\` on its own decodes to nothing. If \`s\` cannot be decoded at all, return \`0\`.

The tests guarantee that the answer fits in a 32-bit signed integer.
`,
  constraints: ["1 <= s.length <= 100", "s consists of digits only", "The answer fits in a 32-bit signed integer"],
  examples: [
    { explanation: "1 7 2 6 (AGBF), 17 2 6 (QBF), 1 7 26 (AGZ) and 17 26 (QZ)." },
    { explanation: "\"30\" is not a letter, and the 0 cannot stand alone, so nothing works." },
    { explanation: "Only \"10\" (J) works; \"1\" followed by \"0\" is not allowed." },
  ],
};
