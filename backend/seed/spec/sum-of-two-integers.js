module.exports = {
  slug: "sum-of-two-integers",
  signature: {
    method: "getSum",
    params: [
      { name: "a", type: "int" },
      { name: "b", type: "int" },
    ],
    returns: "int",
  },
  description: `
Given two integers \`a\` and \`b\`, return their sum **without using the \`+\` or \`-\` operators**.

Think about what addition does bit by bit: XOR gives the sum without carries, and AND (shifted left by one) gives the carries. Repeat until there is nothing left to carry. Negative numbers use two's complement, so the same idea works for them.

*The judge checks only the result; the no-\`+\`/\`-\` rule is the exercise.*
`,
  constraints: ["-1000 <= a, b <= 1000"],
  examples: [
    { explanation: "2 + 5 = 7." },
    { explanation: "-4 + 9 = 5." },
    { explanation: "Two negative numbers: -7 + -8 = -15." },
  ],
  notes: "The no-+/- rule cannot be checked by output comparison; it is stated as part of the exercise.",
};
