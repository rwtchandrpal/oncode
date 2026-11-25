const toBoard = (rows) => rows.map((r) => r.split(""));

// A random simple path of `len` cells on an m x n board (retried until one is found).
const randomPath = (rng, m, n, len) => {
  for (;;) {
    let r = rng.int(0, m - 1), c = rng.int(0, n - 1);
    const seen = new Set([`${r},${c}`]);
    const path = [[r, c]];
    while (path.length < len) {
      const options = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(
        ([a, b]) => a >= 0 && a < m && b >= 0 && b < n && !seen.has(`${a},${b}`)
      );
      if (!options.length) break;
      [r, c] = rng.pick(options);
      seen.add(`${r},${c}`);
      path.push([r, c]);
    }
    if (path.length === len) return path;
  }
};

module.exports = {
  samples: [
    { board: toBoard(["CAT", "XOS", "DOG"]), word: "CATS" },
    { board: toBoard(["CAT", "XOS", "DOG"]), word: "COAT" },
    { board: toBoard(["a"]), word: "a" },
  ],

  hidden(rng) {
    const letters = "abcdefABCDEF";
    const board = toBoard(rng.array(6, () => rng.string(6, letters)));
    const path = randomPath(rng, 6, 6, 12);
    const present = path.map(([r, c]) => board[r][c]).join("");
    return [
      { note: "a cell cannot be reused", args: { board: toBoard(["AB", "CD"]), word: "ABA" } },
      { note: "case-sensitive", args: { board: toBoard(["a"]), word: "A" } },
      { note: "word longer than the board", args: { board: toBoard(["ab", "cd"]), word: "abdca" } },
      { note: "6x6 all A, word ends in B (search trap)", args: { board: toBoard(rng.array(6, () => "AAAAAA")), word: "AAAAAAAAAAAAAAB" } },
      { note: "6x6 all A, 15 A's (present)", args: { board: toBoard(rng.array(6, () => "AAAAAA")), word: "A".repeat(15) } },
      { note: "6x6 random, 12-letter path present", args: { board, word: present } },
      { note: "6x6 random, absent word", args: { board: toBoard(rng.array(6, () => rng.string(6, "abc"))), word: "abcabcabcabcabd" } },
    ];
  },

  validate({ board, word }) {
    const m = board.length;
    if (m < 1 || m > 6) throw new Error("rows out of range");
    const n = board[0].length;
    if (n < 1 || n > 6 || board.some((r) => r.length !== n)) throw new Error("bad column count");
    if (!board.flat().every((ch) => /^[A-Za-z]$/.test(ch))) throw new Error("bad board letter");
    if (word.length < 1 || word.length > 15 || !/^[A-Za-z]+$/.test(word)) throw new Error("bad word");
  },
};
