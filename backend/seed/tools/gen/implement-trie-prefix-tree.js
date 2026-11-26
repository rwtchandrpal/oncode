const { LOWER } = require("../lib/rng");
const { ops, checkOps } = require("./_design");

// Random session: inserts from a word pool, then searches/prefix queries for hits and misses.
const session = (rng, calls, alphabet, maxLen) => {
  const pool = rng.array(Math.max(5, calls / 4), () => rng.string(rng.int(1, maxLen), alphabet));
  const inserted = [];
  const list = [];
  for (let i = 0; i < calls; i++) {
    const r = rng.next();
    if (r < 0.35 || !inserted.length) {
      const w = rng.pick(pool);
      inserted.push(w);
      list.push(["insert", w]);
    } else if (r < 0.7) {
      list.push(["search", rng.next() < 0.5 ? rng.pick(inserted) : rng.pick(pool)]);
    } else {
      const w = rng.pick(rng.next() < 0.5 ? inserted : pool);
      list.push(["startsWith", w.slice(0, rng.int(1, w.length))]);
    }
  }
  return ops("Trie", list);
};

module.exports = {
  samples: [
    ops("Trie", [["insert", "car"], ["search", "car"], ["search", "ca"], ["startsWith", "ca"]]),
    ops("Trie", [["search", "a"], ["startsWith", "a"]]),
    ops("Trie", [["insert", "cat"], ["startsWith", "ca"], ["search", "ca"], ["insert", "ca"], ["search", "ca"]]),
  ],

  hidden(rng) {
    const long = rng.string(2000, "ab");
    return [
      { note: "word is a prefix of itself", args: ops("Trie", [["insert", "a"], ["startsWith", "a"], ["search", "a"], ["search", "aa"]]) },
      { note: "duplicate inserts", args: ops("Trie", [["insert", "x"], ["insert", "x"], ["search", "x"], ["startsWith", "xy"]]) },
      { note: "2000-letter word and its prefixes", args: ops("Trie", [["insert", long], ["search", long], ["search", long.slice(0, 1999)], ["startsWith", long.slice(0, 1999)], ["startsWith", long.slice(0, 1999) + (long[1999] === "a" ? "b" : "a")]]) },
      { note: "200 calls, alphabet ab", args: session(rng, 200, "ab", 6) },
      { note: "3000 calls, full alphabet", args: session(rng, 3000, LOWER, 10) },
      { note: "8000 calls, alphabet abc", args: session(rng, 8000, "abc", 8) },
      { note: "8000 calls, long words", args: session(rng, 8000, LOWER, 12) },
    ];
  },

  validate(args) {
    checkOps(args, "Trie", { insert: 1, search: 1, startsWith: 1 }, 3e4);
    for (const [w] of args.arguments.slice(1)) {
      if (w.length < 1 || w.length > 2000 || !/^[a-z]+$/.test(w)) throw new Error("bad word");
    }
  },
};
