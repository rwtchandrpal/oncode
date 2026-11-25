module.exports = {
  slug: "reverse-bits",
  signature: { method: "reverseBits", params: [{ name: "n", type: "uint32" }], returns: "uint32" },
  description: `
Treat \`n\` as an **unsigned 32-bit** integer and reverse the order of its 32 bits: bit 0 becomes bit 31, bit 1 becomes bit 30, and so on. Return the resulting unsigned value.

Input and output are written as unsigned decimal numbers between \`0\` and \`4294967295\`.

**Language note:** in C++ the type is \`uint32_t\`. Java has no unsigned int, so \`n\` arrives as an \`int\` holding the same 32 bits (values above \`2^31 - 1\` appear negative), and your returned \`int\` is read back as unsigned. Use \`>>>\` for shifts in Java.
`,
  constraints: ["0 <= n <= 2^32 - 1 (32 bits)"],
  examples: [
    { explanation: "1 is 31 zeros then a 1. Reversed it is a 1 then 31 zeros, which is 2^31." },
    { explanation: "6 ends in the bits 110. Reversed, the top bits are 011 followed by zeros: 0x60000000." },
    { explanation: "4294967293 is all ones except bit 1. Reversed, only bit 30 is 0: 0xBFFFFFFF." },
  ],
};
