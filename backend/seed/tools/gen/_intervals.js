// Shared helpers for the interval generators (not a problem generator itself).
// Random intervals [start, end] with start < end (strict unless allowPoint).
const randomIntervals = (rng, n, lo, hi, maxLen, allowPoint = false) =>
  rng.array(n, () => {
    const len = rng.int(allowPoint ? 0 : 1, maxLen);
    const start = rng.int(lo, hi - len);
    return [start, start + len];
  });

// n disjoint intervals in increasing order that do not touch (gap >= 1), inside [lo, hi].
const disjointSorted = (rng, n, lo, maxLen, maxGap) => {
  const out = [];
  let x = lo;
  for (let i = 0; i < n; i++) {
    const start = x + rng.int(1, maxGap);
    const end = start + rng.int(0, maxLen);
    out.push([start, end]);
    x = end;
  }
  return out;
};

const checkIntervals = (intervals, lo, hi, strict) => {
  for (const iv of intervals) {
    if (!Array.isArray(iv) || iv.length !== 2) throw new Error("each interval needs exactly 2 numbers");
    const [a, b] = iv;
    if (a < lo || b > hi) throw new Error("endpoint out of range");
    if (strict ? a >= b : a > b) throw new Error(`bad interval [${a},${b}]`);
  }
};

module.exports = { randomIntervals, disjointSorted, checkIntervals };
