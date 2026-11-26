// Shared binary-tree helpers for tree generators (not a problem generator itself).
// Trees are plain objects { val, left, right }; the serialised form is LeetCode-style level order
// with null for missing children and trailing nulls removed ([] for an empty tree).

const node = (val, left = null, right = null) => ({ val, left, right });

const toLevel = (root) => {
  const out = [];
  const queue = [root];
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i];
    if (!n) { out.push(null); continue; }
    out.push(n.val);
    queue.push(n.left, n.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
};

const fromLevel = (arr) => {
  if (!arr.length || arr[0] === null) return null;
  const root = node(arr[0]);
  const queue = [root];
  let i = 1;
  for (let h = 0; h < queue.length && i < arr.length; h++) {
    const n = queue[h];
    if (i < arr.length && arr[i] !== null) { n.left = node(arr[i]); queue.push(n.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { n.right = node(arr[i]); queue.push(n.right); }
    i++;
  }
  return root;
};

const nodes = (root) => {
  const out = [];
  const stack = root ? [root] : [];
  while (stack.length) {
    const n = stack.pop();
    out.push(n);
    if (n.right) stack.push(n.right);
    if (n.left) stack.push(n.left);
  }
  return out; // preorder
};

const inorder = (root) => {
  const out = [];
  const stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    out.push(cur.val);
    cur = cur.right;
  }
  return out;
};

const preorder = (root) => nodes(root).map((n) => n.val);

const height = (root) => {
  let h = 0;
  let level = root ? [root] : [];
  while (level.length) {
    h++;
    level = level.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return h;
};

// Random shape: each new node takes a random free child slot of the tree so far.
const randomShape = (rng, n, valFn) => {
  if (n === 0) return null;
  const root = node(valFn(0));
  const slots = [[root, "left"], [root, "right"]];
  for (let i = 1; i < n; i++) {
    const k = rng.int(0, slots.length - 1);
    const [parent, side] = slots[k];
    slots[k] = slots[slots.length - 1];
    slots.pop();
    const child = node(valFn(i));
    parent[side] = child;
    slots.push([child, "left"], [child, "right"]);
  }
  return root;
};

// Skewed chain of n nodes (side = "left" or "right").
const chain = (n, valFn, side) => {
  if (n === 0) return null;
  const root = node(valFn(0));
  let cur = root;
  for (let i = 1; i < n; i++) { cur[side] = node(valFn(i)); cur = cur[side]; }
  return root;
};

// Complete tree of n nodes in level order.
const complete = (n, valFn) => fromLevel(Array.from({ length: n }, (_, i) => valFn(i)));

// BST by inserting values in the given order (iterative, so long chains are fine).
const bstInsert = (values) => {
  let root = null;
  for (const v of values) {
    if (!root) { root = node(v); continue; }
    let cur = root;
    for (;;) {
      const side = v < cur.val ? "left" : "right";
      if (!cur[side]) { cur[side] = node(v); break; }
      cur = cur[side];
    }
  }
  return root;
};

// Balanced BST from sorted values.
const balancedBst = (sorted, lo = 0, hi = sorted.length - 1) => {
  if (lo > hi) return null;
  const mid = (lo + hi) >> 1;
  return node(sorted[mid], balancedBst(sorted, lo, mid - 1), balancedBst(sorted, mid + 1, hi));
};

const checkTreeValues = (level, lo, hi) => {
  for (const v of level) if (v !== null && (v < lo || v > hi)) throw new Error(`value ${v} out of range`);
};
const countNodes = (level) => level.filter((v) => v !== null).length;

module.exports = {
  node, toLevel, fromLevel, nodes, inorder, preorder, height, randomShape, chain, complete,
  bstInsert, balancedBst, checkTreeValues, countNodes,
};
