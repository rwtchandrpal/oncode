module.exports = {
  samples: [
    { coins: [1, 3, 4], amount: 6 },
    { coins: [5, 10], amount: 3 },
    { coins: [7], amount: 0 },
  ],

  hidden(rng) {
    return [
      { note: "odd amount, only coin 2", args: { coins: [2], amount: 3 } },
      { note: "coin 1, amount 10000", args: { coins: [1], amount: 10000 } },
      { note: "huge coin values", args: { coins: [2147483647, 1000000000], amount: 2 } },
      { note: "greedy trap", args: { coins: [1, 5, 6, 9], amount: 11 } },
      { note: "four mid-size coins, amount 6249", args: { coins: [186, 419, 83, 408], amount: 6249 } },
      { note: "12 random coins, amount 10000", args: { coins: rng.distinct(12, 20, 500), amount: 10000 } },
      { note: "coprime coins 7 and 13, amount 9997", args: { coins: [13, 7], amount: 9997 } },
    ];
  },

  validate({ coins, amount }) {
    if (coins.length < 1 || coins.length > 12) throw new Error("coins length out of range");
    if (coins.some((c) => c < 1 || c > 2147483647)) throw new Error("coin out of range");
    if (amount < 0 || amount > 1e4) throw new Error("amount out of range");
  },
};
