// Generates starter code and driver code (C++ and Java) from a problem signature.
// The platform builds a program as driverCode with "{{USER_CODE}}" replaced by the user's code
// (src/services/judgeService.js), so each driver is: header, {{USER_CODE}}, I/O helpers, main.
const fs = require("fs");
const path = require("path");

const IO_CPP = fs.readFileSync(path.join(__dirname, "io.cpp"), "utf8").trimEnd();
const IO_JAVA = fs.readFileSync(path.join(__dirname, "io.java"), "utf8").trimEnd();

// Canonical type name -> how it looks in each language. cppParam is the parameter type in the
// user's method; cppDefault/javaDefault are the placeholder return values in the starter code.
const TYPES = {
  int: { cpp: "int", cppParam: "int", cppDefault: "0", java: "int", javaRead: "readInt()", javaDefault: "0" },
  long: { cpp: "long long", cppParam: "long long", cppDefault: "0", java: "long", javaRead: "readLong()", javaDefault: "0" },
  bool: { cpp: "bool", cppParam: "bool", cppDefault: "false", java: "boolean", javaRead: "readBool()", javaDefault: "false" },
  string: { cpp: "string", cppParam: "string", cppDefault: '""', java: "String", javaRead: "readString()", javaDefault: '""' },
  char: { cpp: "char", cppParam: "char", cppDefault: "' '", java: "char", javaRead: "readChar()", javaDefault: "' '" },
  "int[]": { cpp: "vector<int>", cppParam: "vector<int>&", cppDefault: "{}", java: "int[]", javaRead: "readIntArray()", javaDefault: "new int[0]" },
  "long[]": { cpp: "vector<long long>", cppParam: "vector<long long>&", cppDefault: "{}", java: "long[]", javaRead: "readLongArray()", javaDefault: "new long[0]" },
  "string[]": { cpp: "vector<string>", cppParam: "vector<string>&", cppDefault: "{}", java: "String[]", javaRead: "readStringArray()", javaDefault: "new String[0]" },
  "int[][]": { cpp: "vector<vector<int>>", cppParam: "vector<vector<int>>&", cppDefault: "{}", java: "int[][]", javaRead: "readIntMatrix()", javaDefault: "new int[0][]" },
  "char[][]": { cpp: "vector<vector<char>>", cppParam: "vector<vector<char>>&", cppDefault: "{}", java: "char[][]", javaRead: "readCharMatrix()", javaDefault: "new char[0][]" },
  "List<int>": { cpp: "vector<int>", cppParam: "vector<int>&", cppDefault: "{}", java: "List<Integer>", javaRead: "readIntList()", javaDefault: "new ArrayList<>()" },
  "List<string>": { cpp: "vector<string>", cppParam: "vector<string>&", cppDefault: "{}", java: "List<String>", javaRead: "readStringList()", javaDefault: "new ArrayList<>()" },
  "List<List<int>>": { cpp: "vector<vector<int>>", cppParam: "vector<vector<int>>&", cppDefault: "{}", java: "List<List<Integer>>", javaRead: "readIntListList()", javaDefault: "new ArrayList<>()" },
  "List<List<string>>": { cpp: "vector<vector<string>>", cppParam: "vector<vector<string>>&", cppDefault: "{}", java: "List<List<String>>", javaRead: "readStringListList()", javaDefault: "new ArrayList<>()" },
};

const typeOf = (name) => {
  const t = TYPES[name];
  if (!t) throw new Error(`Unknown type "${name}". Known: ${Object.keys(TYPES).join(", ")}`);
  return t;
};

// Names the driver uses itself; a parameter with one of these names would clash.
const RESERVED = new Set(["oc_in", "oc_out", "oc_sol", "oc_res", "oc_args", "main", "Main", "Solution", "oncode"]);

const checkSignature = (sig) => {
  if (!/^[a-z][A-Za-z0-9]*$/.test(sig.method)) throw new Error(`Bad method name ${sig.method}`);
  for (const p of sig.params) {
    typeOf(p.type);
    if (RESERVED.has(p.name) || !/^[a-z][A-Za-z0-9]*$/.test(p.name)) throw new Error(`Bad parameter name ${p.name}`);
  }
  typeOf(sig.returns);
};

const indent = (code, pad) => code.split("\n").map((l) => (l ? pad + l : l)).join("\n");

const cppStarter = (sig) => {
  const params = sig.params.map((p) => `${typeOf(p.type).cppParam} ${p.name}`).join(", ");
  const ret = typeOf(sig.returns);
  return [
    "class Solution {",
    "public:",
    `    ${ret.cpp} ${sig.method}(${params}) {`,
    "        // Write your solution here",
    `        return ${ret.cppDefault};`,
    "    }",
    "};",
  ].join("\n");
};

const javaStarter = (sig) => {
  const params = sig.params.map((p) => `${typeOf(p.type).java} ${p.name}`).join(", ");
  const ret = typeOf(sig.returns);
  return [
    "class Solution {",
    `    public ${ret.java} ${sig.method}(${params}) {`,
    "        // Write your solution here",
    `        return ${ret.javaDefault};`,
    "    }",
    "}",
  ].join("\n");
};

// post: optional { cpp, java } code that normalises `oc_res` before printing (e.g. sorting when
// any order is accepted). It runs in the driver, after the user's method returns.
const cppDriver = (sig, post = {}) => {
  const reads = sig.params.map((p) => `    ${typeOf(p.type).cpp} ${p.name};\n    oc_in.read(${p.name});`).join("\n");
  const args = sig.params.map((p) => p.name).join(", ");
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "{{USER_CODE}}",
    "",
    IO_CPP,
    "",
    "int main() {",
    "    oncode::Reader oc_in;",
    reads,
    "    oc_in.end();",
    "    Solution oc_sol;",
    `    ${typeOf(sig.returns).cpp} oc_res = oc_sol.${sig.method}(${args});`,
    ...(post.cpp ? [indent(post.cpp, "    ")] : []),
    "    oncode::Writer oc_out;",
    "    oc_out.write(oc_res);",
    "    oc_out.line();",
    "    oc_out.flush();",
    "    return 0;",
    "}",
  ].join("\n");
};

const javaDriver = (sig, post = {}) => {
  const reads = sig.params.map((p) => `        ${typeOf(p.type).java} ${p.name} = ${typeOf(p.type).javaRead};`).join("\n");
  const args = sig.params.map((p) => p.name).join(", ");
  return [
    "import java.util.*;",
    "import java.io.*;",
    "",
    "{{USER_CODE}}",
    "",
    "public class Main {",
    IO_JAVA,
    "",
    "    public static void main(String[] oc_args) throws IOException {",
    "        initInput();",
    reads,
    "        endInput();",
    `        ${typeOf(sig.returns).java} oc_res = new Solution().${sig.method}(${args});`,
    ...(post.java ? [indent(post.java, "        ")] : []),
    "        write(oc_res);",
    "        OUT.append('\\n');",
    "        flushOutput();",
    "    }",
    "}",
  ].join("\n");
};

const generate = (spec) => {
  checkSignature(spec.signature);
  if (spec.drivers) return spec.drivers; // custom drivers (design problems etc.) supply all four pieces
  return {
    cpp: { userSnippet: cppStarter(spec.signature), driverCode: cppDriver(spec.signature, { cpp: spec.post?.cpp }) },
    java: { userSnippet: javaStarter(spec.signature), driverCode: javaDriver(spec.signature, { java: spec.post?.java }) },
  };
};

module.exports = { TYPES, IO_CPP, IO_JAVA, generate, checkSignature };
