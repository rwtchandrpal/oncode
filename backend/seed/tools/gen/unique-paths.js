// C(m + n - 2, m - 1) as a BigInt
const paths = (m, n) => {
  let r = 1n;
  const k = BigInt(Math.min(m, n) - 1);
  const total = BigInt(m + n - 2);
  for (let i = 1n; i <= k; i++) r = (r * (total - k + i)) / i;
  return r;
};

module.exports = {
  samples: [
    { m: 3, n: 3 },
    { m: 2, n: 4 },
    { m: 1, n: 1 },
  ],

  hidden() {
    return [
      { note: "one row, 100 columns", args: { m: 1, n: 100 } },
      { note: "100 rows, one column", args: { m: 100, n: 1 } },
      { note: "2 x 100", args: { m: 2, n: 100 } },
      { note: "10 x 10", args: { m: 10, n: 10 } },
      { note: "17 x 17", args: { m: 17, n: 17 } },
      { note: "12 x 23", args: { m: 12, n: 23 } },
      { note: "51 x 9 (close to 2e9)", args: { m: 51, n: 9 } },
    ];
  },

  validate({ m, n }) {
    if (m < 1 || m > 100 || n < 1 || n > 100) throw new Error("size out of range");
    if (paths(m, n) > 2000000000n) throw new Error(`answer ${paths(m, n)} exceeds 2e9`);
  },
};
