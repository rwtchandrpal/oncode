// Shared helper for design-problem generators: builds the operations/arguments pair.
const ops = (className, calls) => ({
  operations: [className, ...calls.map((c) => c[0])],
  arguments: [[], ...calls.map((c) => c.slice(1))],
});

const checkOps = (args, className, allowed, maxCalls) => {
  const { operations, arguments: a } = args;
  if (operations.length !== a.length) throw new Error("operations and arguments differ in length");
  if (operations[0] !== className || a[0].length !== 0) throw new Error(`first operation must be ${className}()`);
  if (operations.slice(1).includes(className)) throw new Error("constructor called twice");
  if (operations.length - 1 > maxCalls) throw new Error("too many calls");
  for (let i = 1; i < operations.length; i++) {
    const want = allowed[operations[i]];
    if (want === undefined) throw new Error(`unknown operation ${operations[i]}`);
    if (a[i].length !== want) throw new Error(`${operations[i]} takes ${want} argument(s)`);
  }
};

module.exports = { ops, checkOps };
