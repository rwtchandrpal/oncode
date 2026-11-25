module.exports = {
  slug: "best-time-to-buy-and-sell-stock",
  signature: { method: "maxProfit", params: [{ name: "prices", type: "int[]" }], returns: "int" },
  description: `
\`prices[i]\` is the price of a stock on day \`i\`. You may make **at most one trade**: buy one share on some day, then sell it on a **later** day.

Return the largest profit you can make. If no trade makes money, return \`0\`.
`,
  constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
  examples: [
    { explanation: "Buy on day 3 at price 1 and sell on day 4 at price 6, for a profit of 5." },
    { explanation: "The price only falls, so the best choice is not to trade." },
    { explanation: "Buy at 2 on day 0 and sell at 4 on day 1. Buying at 1 on the last day leaves no day to sell." },
  ],
};
