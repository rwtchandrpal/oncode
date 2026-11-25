const { LOWER } = require("../lib/rng");

const breakable = (s, dict) => {
  const words = new Set(dict);
  const ok = [true];
  for (let i = 1; i <= s.length; i++) {
    ok[i] = false;
    for (let k = Math.max(0, i - 20); k < i && !ok[i]; k++) ok[i] = ok[k] && words.has(s.slice(k, i));
  }
  return ok[s.length];
};

const distinctWords = (rng, count, minLen, maxLen, alphabet) => {
  const set = new Set();
  while (set.size < count) set.add(rng.string(rng.int(minLen, maxLen), alphabet));
  return [...set];
};

module.exports = {
  samples: [
    { s: "hotdogstand", wordDict: ["hot", "dog", "stand", "dogs"] },
    { s: "carpet", wordDict: ["car", "pets", "care"] },
    { s: "abab", wordDict: ["ab"] },
  ],

  hidden(rng) {
    const as = Array.from({ length: 10 }, (_, i) => "a".repeat(i + 1));
    const dict = distinctWords(rng, 1000, 1, 8, "abcde");
    let sentence = "";
    while (sentence.length < 280) sentence += rng.pick(dict.slice(0, 200));
    const unbreakable = (() => {
      for (;;) {
        const s = rng.string(300, "abcde");
        if (!breakable(s, dict.slice(0, 40))) return s;
      }
    })();
    return [
      { note: "single letter word", args: { s: "a", wordDict: ["a"] } },
      { note: "single letter, no match", args: { s: "a", wordDict: ["b"] } },
      { note: "aaa...ab trap (exponential without memo)", args: { s: "a".repeat(150) + "b", wordDict: as } },
      { note: "300 a's", args: { s: "a".repeat(300), wordDict: as } },
      { note: "sentence of random dictionary words", args: { s: sentence.slice(0, 300), wordDict: dict } },
      { note: "random string, 40 words, unbreakable", args: { s: unbreakable, wordDict: dict.slice(0, 40) } },
      { note: "1000 long words", args: { s: rng.string(300, LOWER), wordDict: distinctWords(rng, 1000, 15, 20, LOWER) } },
    ];
  },

  validate({ s, wordDict }) {
    if (s.length < 1 || s.length > 300) throw new Error("s length out of range");
    if (wordDict.length < 1 || wordDict.length > 1000) throw new Error("dictionary size out of range");
    if (new Set(wordDict).size !== wordDict.length) throw new Error("duplicate words");
    for (const w of [s, ...wordDict]) if (!/^[a-z]+$/.test(w)) throw new Error("invalid character");
    if (wordDict.some((w) => w.length > 20)) throw new Error("word too long");
  },
};
