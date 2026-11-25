module.exports = {
  slug: "maximum-product-subarray",
  signature: { method: "maxProduct", params: [{ name: "nums", type: "int[]" }], returns: "int" },
  description: `
Given an integer array \`nums\`, find a **non-empty contiguous** subarray whose elements have the largest product, and return that product.

Watch the signs: two negative factors make a positive product, so the smallest (most negative) product ending at a position can turn into the largest one a step later.

The tests guarantee that the product of every subarray fits in a 32-bit signed integer.
`,
  constraints: [
    "1 <= nums.length <= 2 * 10^4",
    "-10 <= nums[i] <= 10",
    "The product of any subarray of nums fits in a 32-bit signed integer",
  ],
  examples: [
    { explanation: "The whole array: (-2) * 3 * (-4) = 24." },
    { explanation: "The subarray [-3, -1] has product 3, which beats [2] and anything that contains a 0." },
    { explanation: "The only subarray is [-5]." },
  ],
};
