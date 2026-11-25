module.exports = {
  slug: "coin-change",
  signature: {
    method: "coinChange",
    params: [
      { name: "coins", type: "int[]" },
      { name: "amount", type: "int" },
    ],
    returns: "int",
  },
  description: `
\`coins\` lists the coin denominations available, and you have an **unlimited** number of coins of each kind.

Return the **fewest coins** whose values add up to exactly \`amount\`. If no combination of coins makes that amount, return \`-1\`. Making an amount of \`0\` needs no coins.
`,
  constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
  examples: [
    { explanation: "3 + 3 = 6 uses two coins. Taking the biggest coin first (4 + 1 + 1) needs three." },
    { explanation: "Every coin is larger than 3, so the amount cannot be made." },
    { explanation: "An amount of 0 needs no coins." },
  ],
};
