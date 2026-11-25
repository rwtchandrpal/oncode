module.exports = {
  slug: "set-matrix-zeroes",
  signature: { method: "setZeroes", params: [{ name: "matrix", type: "int[][]" }], returns: "void", printParam: "matrix" },
  description: `
Given an \`m x n\` integer matrix, find every cell that contains \`0\` and set its **entire row and entire column** to \`0\`. Only zeros that were in the original matrix spread; zeros you write do not.

Modify \`matrix\` **in place**. The method returns nothing; the judge prints \`matrix\` after your method finishes.

**Follow-up:** an extra m x n copy is easy, and O(m + n) extra space is better. Can you use only O(1) extra space?
`,
  constraints: ["m == matrix.length", "n == matrix[0].length", "1 <= m, n <= 200", "-2^31 <= matrix[i][j] <= 2^31 - 1"],
  examples: [
    { explanation: "The 0 at row 0, column 1 clears row 0 and column 1." },
    { explanation: "The 0 in the top-left corner clears the first row and the first column." },
    { explanation: "No zeros, nothing changes." },
  ],
  notes: "In-place problem: the driver prints the matrix after the call.",
};
