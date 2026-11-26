const { PRINTABLE } = require("../lib/rng");

module.exports = {
  samples: [{ strs: ["red", "green", "blue"] }, { strs: [] }, { strs: ["4#ab", "#", "", "12,3"] }],

  hidden(rng) {
    return [
      { note: "one empty string", args: { strs: [""] } },
      { note: "several empty strings", args: { strs: ["", "", ""] } },
      { note: "spaces only", args: { strs: [" ", "  ", "a b"] } },
      { note: "quotes and backslashes", args: { strs: ['"', "\\", '\\"x"', "a\\\\b"] } },
      { note: "199 strings of 199 printable characters", args: { strs: rng.array(199, () => rng.string(199, PRINTABLE)) } },
      { note: "random lengths 0..50", args: { strs: rng.array(150, () => rng.string(rng.int(0, 50), PRINTABLE)) } },
      { note: "digits and # only", args: { strs: rng.array(100, () => rng.string(rng.int(0, 10), "0123456789#")) } },
    ];
  },

  validate({ strs }) {
    if (strs.length >= 200) throw new Error("too many strings");
    for (const s of strs) {
      if (s.length >= 200 || !/^[\x20-\x7e]*$/.test(s)) throw new Error("bad string");
    }
  },
};
