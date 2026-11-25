module.exports = {
  slug: "rotate-image",
  signature: { method: "rotate", params: [{ name: "matrix", type: "int[][]" }], returns: "void", printParam: "matrix" },
  description: `
You are given an \`n x n\` matrix representing an image. Rotate the image by **90 degrees clockwise**.

Do it **in place**: change \`matrix\` itself rather than building and returning a new matrix. The method returns nothing; the judge prints \`matrix\` after your method finishes.
`,
  constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 20", "-1000 <= matrix[i][j] <= 1000"],
  examples: [
    { explanation: "The first column read bottom-up (6, 3, 0) becomes the first row." },
    { explanation: "Clockwise rotation of a 2 x 2 matrix." },
    { explanation: "A 1 x 1 matrix does not change." },
  ],
  notes: "In-place problem: the driver prints the matrix after the call.",
};
