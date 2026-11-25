const LIMIT = 2147483647n;

const count = (s) => {
  let prev2 = 1n, prev1 = s[0] === "0" ? 0n : 1n;
  for (let i = 1; i < s.length; i++) {
    let cur = 0n;
    if (s[i] !== "0") cur += prev1;
    const two = Number(s.slice(i - 1, i + 1));
    if (s[i - 1] !== "0" && two >= 10 && two <= 26) cur += prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
};

// Random digit strings, retried until the count fits in an int and is not 0 (when wanted).
const randomDigits = (rng, n, alphabet, wantNonZero) => {
  for (;;) {
    const s = rng.string(n, alphabet);
    const c = count(s);
    if (c <= LIMIT && (!wantNonZero || c > 0n)) return s;
  }
};

module.exports = {
  samples: [{ s: "1726" }, { s: "301" }, { s: "10" }],

  hidden(rng) {
    return [
      { note: "single zero", args: { s: "0" } },
      { note: "single digit", args: { s: "1" } },
      { note: "double zero", args: { s: "100" } },
      { note: "only one split works", args: { s: "2101" } },
      { note: "45 ones (answer 1836311903)", args: { s: "1".repeat(45) } },
      { note: "n=100 random, decodable", args: { s: randomDigits(rng, 100, "1234567891234567892", true) } },
      { note: "n=100 random with zeros", args: { s: randomDigits(rng, 100, "0123456789112", false) } },
    ];
  },

  validate({ s }) {
    if (s.length < 1 || s.length > 100) throw new Error("length out of range");
    if (!/^[0-9]+$/.test(s)) throw new Error("non-digit");
    if (count(s) > LIMIT) throw new Error("answer does not fit in 32 bits");
  },
};
