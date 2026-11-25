module.exports = {
  slug: "spiral-matrix",
  signature: { method: "spiralOrder", params: [{ name: "matrix", type: "int[][]" }], returns: "List<int>" },
  description: `
Given an \`m x n\` matrix, return all of its elements in **spiral order**: start at the top-left corner, go right along the top row, down the right column, left along the bottom row, up the left column, and keep circling inwards until every element has been visited once.
`,
  constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 10", "-100 <= matrix[i][j] <= 100"],
  examples: [
    { explanation: "Right along the top row, down to 8, then left along the bottom row." },
    { explanation: "A 1 x 1 matrix." },
    { explanation: "A single column is read top to bottom." },
  ],
};
