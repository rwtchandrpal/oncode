// Judge0 is called with base64_encoded=true, so source, stdin and outputs travel as base64.
const encodeBase64 = (str) => {
  if (!str) return "";
  return Buffer.from(String(str), "utf8").toString("base64");
};

const decodeBase64 = (str) => {
  if (!str) return "";
  return Buffer.from(String(str), "base64").toString("utf8");
};

module.exports = { encodeBase64, decodeBase64 };
