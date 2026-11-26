const { LOWER } = require("../lib/rng");
const { ops, checkOps } = require("./_design");

// Replace up to `dots` random positions with '.'.
const dotted = (rng, w, dots) => {
  const a = w.split("");
  for (let k = 0; k < dots; k++) a[rng.int(0, a.length - 1)] = ".";
  return a.join("");
};

const session = (rng, calls, alphabet, maxLen) => {
  const pool = rng.array(Math.max(5, calls / 4), () => rng.string(rng.int(1, maxLen), alphabet));
  const added = [];
  const list = [];
  for (let i = 0; i < calls; i++) {
    if (rng.next() < 0.4 || !added.length) {
      const w = rng.pick(pool);
      added.push(w);
      list.push(["addWord", w]);
    } else {
      const base = rng.next() < 0.6 ? rng.pick(added) : rng.pick(pool);
      list.push(["search", dotted(rng, base, rng.int(0, 2))]);
    }
  }
  return ops("WordDictionary", list);
};

module.exports = {
  samples: [
    ops("WordDictionary", [["addWord", "bad"], ["addWord", "dad"], ["search", "b.d"], ["search", ".ad"], ["search", "ba"]]),
    ops("WordDictionary", [["search", "."]]),
    ops("WordDictionary", [["addWord", "cat"], ["search", "c."], ["search", "c.t"]]),
  ],

  hidden(rng) {
    const long = rng.string(25, LOWER);
    return [
      { note: "single letter and a dot", args: ops("WordDictionary", [["addWord", "a"], ["search", "."], ["search", "a"], ["search", ".."]]) },
      { note: "dots at both ends", args: ops("WordDictionary", [["addWord", "abcde"], ["search", ".bcd."], ["search", ".bce."], ["search", "abcde"]]) },
      { note: "25-letter word with two dots", args: ops("WordDictionary", [["addWord", long], ["search", dotted(rng, long, 2)], ["search", long.slice(0, 24) + "."], ["search", long.slice(0, 24)]]) },
      { note: "300 calls, alphabet ab", args: session(rng, 300, "ab", 5) },
      { note: "3000 calls, full alphabet", args: session(rng, 3000, LOWER, 8) },
      { note: "10000 calls, alphabet abc", args: session(rng, 10000, "abc", 6) },
      { note: "6500 calls, long words", args: session(rng, 6500, LOWER, 25) },
    ];
  },

  validate(args) {
    checkOps(args, "WordDictionary", { addWord: 1, search: 1 }, 1e4);
    args.operations.forEach((op, i) => {
      if (i === 0) return;
      const w = args.arguments[i][0];
      if (w.length < 1 || w.length > 25) throw new Error("bad word length");
      if (op === "addWord" && !/^[a-z]+$/.test(w)) throw new Error("addWord needs lowercase letters");
      if (op === "search" && (!/^[a-z.]+$/.test(w) || (w.match(/\./g) || []).length > 2)) throw new Error("bad search pattern");
    });
  },
};
