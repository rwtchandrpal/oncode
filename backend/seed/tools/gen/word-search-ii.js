const { LOWER } = require("../lib/rng");

const toBoard = (rows) => rows.map((r) => r.split(""));
const randomBoard = (rng, m, n, alphabet) => rng.array(m, () => rng.array(n, () => rng.pick(alphabet)));

// Words read along random simple paths of the board (so they are present), plus random words.
const pathWord = (rng, board, len) => {
  const m = board.length, n = board[0].length;
  for (;;) {
    let r = rng.int(0, m - 1), c = rng.int(0, n - 1);
    const seen = new Set([`${r},${c}`]);
    let w = board[r][c];
    while (w.length < len) {
      const opts = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < m && b < n && !seen.has(`${a},${b}`));
      if (!opts.length) break;
      [r, c] = rng.pick(opts);
      seen.add(`${r},${c}`);
      w += board[r][c];
    }
    if (w.length === len) return w;
  }
};

const wordList = (rng, board, present, absent, alphabet) => {
  const set = new Set();
  while (set.size < present) set.add(pathWord(rng, board, rng.int(1, 10)));
  while (set.size < present + absent) set.add(rng.string(rng.int(1, 10), alphabet));
  return rng.shuffle([...set]);
};

module.exports = {
  samples: [
    { board: toBoard(["cat", "xoq", "dog"]), words: ["cat", "dog", "cow"] },
    { board: toBoard(["ab"]), words: ["aba", "ab"] },
    { board: toBoard(["z"]), words: ["z", "zz"] },
  ],

  hidden(rng) {
    const b1 = randomBoard(rng, 12, 12, LOWER);
    const b2 = randomBoard(rng, 12, 12, "abcde");
    const b3 = randomBoard(rng, 8, 10, "ab");
    return [
      { note: "1x1 board, word longer than board", args: { board: toBoard(["a"]), words: ["a", "aa", "b"] } },
      { note: "all-same board, repeated letters", args: { board: toBoard(["aaa", "aaa"]), words: ["aaaaaa", "aaaaaaa", "a", "aaa"] } },
      { note: "word is a prefix of another", args: { board: toBoard(["abcd"]), words: ["ab", "abc", "abd", "abcd"] } },
      { note: "12x12 random, 500 words", args: { board: b1, words: wordList(rng, b1, 200, 300, LOWER) } },
      { note: "12x12 abcde, 8000 words", args: { board: b2, words: wordList(rng, b2, 3000, 5000, "abcde") } },
      // only 2046 strings of length <= 10 exist over {a, b}, so ask for far fewer present words
      { note: "8x10 ab, 5000 words", args: { board: b3, words: wordList(rng, b3, 600, 4400, "abc") } },
      { note: "12x12 random, 8000 mostly absent words", args: { board: b1, words: wordList(rng, b1, 100, 7900, LOWER) } },
    ];
  },

  validate({ board, words }) {
    const m = board.length;
    if (m < 1 || m > 12) throw new Error("rows out of range");
    const n = board[0].length;
    if (n < 1 || n > 12 || board.some((r) => r.length !== n)) throw new Error("bad column count");
    if (!board.flat().every((c) => /^[a-z]$/.test(c))) throw new Error("bad board letter");
    if (words.length < 1 || words.length > 3e4) throw new Error("word count out of range");
    if (new Set(words).size !== words.length) throw new Error("words not distinct");
    for (const w of words) if (w.length < 1 || w.length > 10 || !/^[a-z]+$/.test(w)) throw new Error("bad word");
  },
};
