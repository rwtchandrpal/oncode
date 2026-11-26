const { LOWER } = require("../lib/rng");

// Words over `letters`, sorted by the alien alphabet `order`.
const sortedWords = (rng, count, letters, order, maxLen) => {
  const rank = Object.fromEntries(order.split("").map((c, i) => [c, i]));
  const cmp = (a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return rank[a[i]] - rank[b[i]];
    return a.length - b.length;
  };
  return rng.array(count, () => rng.string(rng.int(1, maxLen), letters)).sort(cmp);
};

module.exports = {
  samples: [{ words: ["cab", "cba", "ab", "b"] }, { words: ["abc", "ab"] }, { words: ["dog"] }],

  hidden(rng) {
    const order = rng.shuffle(LOWER.split("")).join("");
    const big = sortedWords(rng, 100, LOWER, order, 12);
    // moving the last word to the front reverses its first-letter rule with the old first word
    const contradicted = big.slice();
    contradicted.unshift(contradicted.pop());
    const letters6 = "uvwxyz";
    const order6 = rng.shuffle(letters6.split("")).join("");
    return [
      { note: "two-letter cycle", args: { words: ["z", "x", "z"] } },
      { note: "one rule, several valid orders", args: { words: ["ab", "adc"] } },
      { note: "identical words", args: { words: ["aaa", "aaa"] } },
      { note: "100 words, 6 letters, consistent", args: { words: sortedWords(rng, 100, letters6, order6, 8) } },
      { note: "100 words, 26 letters, consistent", args: { words: big } },
      { note: "100 words, last word moved first", args: { words: contradicted } },
      { note: "prefix after a longer word", args: { words: ["mn", "mnop", "mno", "q"] } },
    ];
  },

  validate({ words }) {
    if (words.length < 1 || words.length > 100) throw new Error("word count out of range");
    for (const w of words) if (w.length < 1 || w.length > 100 || !/^[a-z]+$/.test(w)) throw new Error("bad word");
  },
};
