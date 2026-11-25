const OPEN = "([{";
const CLOSE_OF = { "(": ")", "[": "]", "{": "}" };

// Random valid bracket string of even length n. pushBias > 0.5 makes deeper nesting.
const validString = (rng, n, pushBias) => {
  const out = [];
  const stack = [];
  while (out.length < n) {
    const remaining = n - out.length;
    const canPush = stack.length + 1 <= remaining - 1;
    if (stack.length === 0 || (canPush && rng.next() < pushBias)) {
      const o = rng.pick(OPEN);
      stack.push(o);
      out.push(o);
    } else {
      out.push(CLOSE_OF[stack.pop()]);
    }
  }
  return out.join("");
};

module.exports = {
  samples: [{ s: "([]{})" }, { s: "([)]" }, { s: "((" }],

  hidden(rng) {
    const opens = rng.array(50000, () => rng.pick(OPEN));
    const deep = opens.join("") + opens.slice().reverse().map((o) => CLOSE_OF[o]).join("");
    const broken = validString(rng, 100000, 0.5).split("");
    // swap one closing bracket for a different closing type near the end
    let k = broken.length - 1;
    while (OPEN.includes(broken[k - 7])) k--;
    const at = k - 7;
    broken[at] = broken[at] === ")" ? "]" : ")";
    return [
      { note: "single opening bracket", args: { s: "(" } },
      { note: "single closing bracket", args: { s: ")" } },
      { note: "close before open", args: { s: "}{" } },
      { note: "n=2000 random valid", args: { s: validString(rng, 2000, 0.5) } },
      { note: "n=2001 odd length", args: { s: validString(rng, 2000, 0.5) + "[" } },
      { note: "large n=100000, nesting depth 50000", args: { s: deep } },
      { note: "large n=100000, one wrong closer", args: { s: broken.join("") } },
    ];
  },

  validate({ s }) {
    if (s.length < 1 || s.length > 1e5) throw new Error("length out of range");
    if (!/^[()[\]{}]+$/.test(s)) throw new Error("invalid character");
  },
};
