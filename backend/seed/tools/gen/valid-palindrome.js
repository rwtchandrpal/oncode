const { LOWER, DIGITS, PRINTABLE } = require("../lib/rng");

const ALNUM = LOWER + DIGITS;
const NOISE = PRINTABLE.split("").filter((c) => !/[A-Za-z0-9]/.test(c)).join(""); // includes space, " and \

const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// A palindrome of `core` letters/digits, with random letter case and random noise between characters.
const noisy = (rng, chars, noiseRate) =>
  chars
    .map((c) => {
      const cased = /[a-z]/.test(c) && rng.next() < 0.5 ? c.toUpperCase() : c;
      let gap = "";
      while (rng.next() < noiseRate) gap += rng.pick(NOISE);
      return cased + gap;
    })
    .join("");

const palindromeChars = (rng, half) => {
  const left = rng.array(half, () => rng.pick(ALNUM));
  return [...left, ...left.slice().reverse()];
};

module.exports = {
  samples: [{ s: "Step on no pets!" }, { s: "Palindrome, not." }, { s: ".,!" }],

  hidden(rng) {
    const broken = palindromeChars(rng, 50000);
    const mid = broken.length / 2;
    broken[mid] = broken[mid - 1] === "a" ? "b" : "a"; // breaks the mirror at the centre
    return [
      { note: "single letter", args: { s: "a" } },
      { note: "digit vs letter (0P)", args: { s: "0P" } },
      { note: "mixed case and digits", args: { s: "Ab1 ,1bA" } },
      { note: "n~2000 palindrome, quotes/backslashes", args: { s: noisy(rng, palindromeChars(rng, 700), 0.4) } },
      { note: "n=2000 random string", args: { s: rng.string(2000, PRINTABLE) } },
      { note: "large palindrome with noise", args: { s: noisy(rng, palindromeChars(rng, 50000), 0.3) } },
      { note: "large, mismatch at the centre", args: { s: noisy(rng, broken, 0.3) } },
    ];
  },

  validate({ s }) {
    if (s.length < 1 || s.length > 2e5) throw new Error("length out of range");
    if (!/^[\x20-\x7e]+$/.test(s)) throw new Error("non-printable character");
  },

  clean,
};
