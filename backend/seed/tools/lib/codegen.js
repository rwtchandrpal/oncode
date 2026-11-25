// Generates starter code and driver code (C++ and Java) from a problem signature.
// The platform builds a program as driverCode with "{{USER_CODE}}" replaced by the user's code
// (src/services/judgeService.js), so each driver is: header (+ node types in C++), {{USER_CODE}},
// I/O helpers, main. Java node classes go after {{USER_CODE}} so user imports stay legal.
//
// Signature: { method, params: [{ name, type, of?, driverOnly? }], returns, printParam? }
//   driverOnly  read from stdin and shown in examples, but not passed to the method (e.g. pos)
//   of          for TreeNodeRef: the tree parameter the value is looked up in
//   printParam  for returns "void": the parameter to print after the call (in-place problems)
// Spec hooks: post { cpp, java } normalises oc_res; prelude { cpp, java } runs before the call.
const fs = require("fs");
const path = require("path");
const structs = require("./structs");

const IO_CPP = fs.readFileSync(path.join(__dirname, "io.cpp"), "utf8").trimEnd();
const IO_JAVA = fs.readFileSync(path.join(__dirname, "io.java"), "utf8").trimEnd();

const simple = (cpp, cppParam, cppDefault, java, javaRead, javaDefault) => ({
  cpp, cppParam, cppDefault, java, javaDefault,
  cppRead: (n) => `${cpp} ${n};\noc_in.read(${n});`,
  javaRead: (n) => `${java} ${n} = ${javaRead};`,
  cppOut: (e) => e,
  javaOut: (e) => e,
});

const TYPES = {
  int: simple("int", "int", "0", "int", "readInt()", "0"),
  long: simple("long long", "long long", "0", "long", "readLong()", "0"),
  bool: simple("bool", "bool", "false", "boolean", "readBool()", "false"),
  string: simple("string", "string", '""', "String", "readString()", '""'),
  char: simple("char", "char", "' '", "char", "readChar()", "' '"),
  "int[]": simple("vector<int>", "vector<int>&", "{}", "int[]", "readIntArray()", "new int[0]"),
  "long[]": simple("vector<long long>", "vector<long long>&", "{}", "long[]", "readLongArray()", "new long[0]"),
  "string[]": simple("vector<string>", "vector<string>&", "{}", "String[]", "readStringArray()", "new String[0]"),
  "int[][]": simple("vector<vector<int>>", "vector<vector<int>>&", "{}", "int[][]", "readIntMatrix()", "new int[0][]"),
  "char[][]": simple("vector<vector<char>>", "vector<vector<char>>&", "{}", "char[][]", "readCharMatrix()", "new char[0][]"),
  "List<int>": simple("vector<int>", "vector<int>&", "{}", "List<Integer>", "readIntList()", "new ArrayList<>()"),
  "List<string>": simple("vector<string>", "vector<string>&", "{}", "List<String>", "readStringList()", "new ArrayList<>()"),
  "List<List<int>>": simple("vector<vector<int>>", "vector<vector<int>>&", "{}", "List<List<Integer>>", "readIntListList()", "new ArrayList<>()"),
  "List<List<string>>": simple("vector<vector<string>>", "vector<vector<string>>&", "{}", "List<List<String>>", "readStringListList()", "new ArrayList<>()"),
  // Unsigned 32-bit value: C++ uint32_t, Java int holding the same bits (as LeetCode does).
  uint32: {
    cpp: "uint32_t", cppParam: "uint32_t", cppDefault: "0", java: "int", javaDefault: "0",
    cppRead: (n) => `long long oc_v_${n};\noc_in.read(oc_v_${n});\nuint32_t ${n} = (uint32_t)oc_v_${n};`,
    javaRead: (n) => `int ${n} = (int) readLong();`,
    cppOut: (e) => `(long long)(${e})`,
    javaOut: (e) => `Integer.toUnsignedLong(${e})`,
  },
  ListNode: {
    cpp: "ListNode*", cppParam: "ListNode*", cppDefault: "nullptr", java: "ListNode", javaDefault: "null", needs: "list",
    cppRead: (n) => `vector<int> oc_v_${n};\noc_in.read(oc_v_${n});\nListNode* ${n} = oncode::buildList(oc_v_${n});`,
    javaRead: (n) => `ListNode ${n} = buildList(readIntArray());`,
    cppOut: (e) => `oncode::listOut(${e})`,
    javaOut: (e) => `listOut(${e})`,
  },
  "ListNode[]": {
    cpp: "vector<ListNode*>", cppParam: "vector<ListNode*>&", cppDefault: "{}", java: "ListNode[]", javaDefault: "new ListNode[0]", needs: "list",
    cppRead: (n) => `vector<vector<int>> oc_v_${n};\noc_in.read(oc_v_${n});\nvector<ListNode*> ${n};\nfor (auto& oc_l : oc_v_${n}) ${n}.push_back(oncode::buildList(oc_l));`,
    javaRead: (n) => `ListNode[] ${n} = buildLists(readIntMatrix());`,
  },
  TreeNode: {
    cpp: "TreeNode*", cppParam: "TreeNode*", cppDefault: "nullptr", java: "TreeNode", javaDefault: "null", needs: "tree",
    cppRead: (n) => `vector<oncode::Opt> oc_v_${n};\noc_in.read(oc_v_${n});\nTreeNode* ${n} = oncode::buildTree(oc_v_${n});`,
    javaRead: (n) => `TreeNode ${n} = buildTree(readNullableIntList());`,
    cppOut: (e) => `oncode::treeOut(${e})`,
    javaOut: (e) => `treeOut(${e})`,
  },
  // A node of another tree parameter, given on stdin by its (unique) value; printed back as its value.
  TreeNodeRef: {
    cpp: "TreeNode*", cppParam: "TreeNode*", cppDefault: "nullptr", java: "TreeNode", javaDefault: "null", needs: "tree",
    cppRead: (n, p) => `int oc_v_${n};\noc_in.read(oc_v_${n});\nTreeNode* ${n} = oncode::findNode(${p.of}, oc_v_${n});`,
    javaRead: (n, p) => `TreeNode ${n} = findNode(${p.of}, readInt());`,
    cppOut: (e) => `oncode::nodeVal(${e})`,
    javaOut: (e) => `nodeVal(${e})`,
  },
};

const typeOf = (name) => {
  const t = TYPES[name];
  if (!t) throw new Error(`Unknown type "${name}". Known: ${Object.keys(TYPES).join(", ")}`);
  return t;
};

// Names the driver uses itself; a parameter with one of these names would clash.
const RESERVED = new Set(["oc_in", "oc_out", "oc_sol", "oc_res", "oc_args", "main", "Main", "Solution", "oncode"]);
const ident = /^[a-z][A-Za-z0-9]*$/;

const checkSignature = (sig) => {
  if (!ident.test(sig.method)) throw new Error(`Bad method name ${sig.method}`);
  const names = new Set();
  for (const p of sig.params) {
    typeOf(p.type);
    if (RESERVED.has(p.name) || !ident.test(p.name) || names.has(p.name)) throw new Error(`Bad parameter name ${p.name}`);
    if (p.type === "TreeNodeRef" && !names.has(p.of)) throw new Error(`${p.name}: "of" must name an earlier tree parameter`);
    names.add(p.name);
  }
  if (sig.returns === "void") {
    if (!sig.printParam || !names.has(sig.printParam)) throw new Error("void methods need printParam");
  } else {
    typeOf(sig.returns);
  }
};

const needs = (sig) => {
  const set = new Set();
  for (const t of [...sig.params.map((p) => p.type), sig.returns]) if (TYPES[t]?.needs) set.add(TYPES[t].needs);
  return [...set].sort();
};

const indent = (code, pad) => code.split("\n").map((l) => (l ? pad + l : l)).join("\n");
const userParams = (sig) => sig.params.filter((p) => !p.driverOnly);

const cppStarter = (sig) => {
  const params = userParams(sig).map((p) => `${typeOf(p.type).cppParam} ${p.name}`).join(", ");
  const isVoid = sig.returns === "void";
  const docs = needs(sig).map((n) => structs[n].cppDoc);
  return [
    ...docs.map((d) => d + "\n"),
    "class Solution {",
    "public:",
    `    ${isVoid ? "void" : typeOf(sig.returns).cpp} ${sig.method}(${params}) {`,
    "        // Write your solution here",
    ...(isVoid ? [] : [`        return ${typeOf(sig.returns).cppDefault};`]),
    "    }",
    "};",
  ].join("\n");
};

const javaStarter = (sig) => {
  const params = userParams(sig).map((p) => `${typeOf(p.type).java} ${p.name}`).join(", ");
  const isVoid = sig.returns === "void";
  const docs = needs(sig).map((n) => structs[n].javaDoc);
  return [
    ...docs.map((d) => d + "\n"),
    "class Solution {",
    `    public ${isVoid ? "void" : typeOf(sig.returns).java} ${sig.method}(${params}) {`,
    "        // Write your solution here",
    ...(isVoid ? [] : [`        return ${typeOf(sig.returns).javaDefault};`]),
    "    }",
    "}",
  ].join("\n");
};

const cppDriver = (sig, hooks = {}) => {
  const reads = sig.params.map((p) => indent(typeOf(p.type).cppRead(p.name, p), "    ")).join("\n");
  const args = userParams(sig).map((p) => p.name).join(", ");
  const isVoid = sig.returns === "void";
  const printed = isVoid
    ? typeOf(sig.params.find((p) => p.name === sig.printParam).type).cppOut(sig.printParam)
    : typeOf(sig.returns).cppOut("oc_res");
  const used = needs(sig);
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    ...used.map((n) => structs[n].cppHeader + "\n"),
    "{{USER_CODE}}",
    "",
    IO_CPP,
    ...used.map((n) => "\n" + structs[n].cppHelpers),
    "",
    "int main() {",
    "    oncode::Reader oc_in;",
    reads,
    "    oc_in.end();",
    ...(hooks.prelude ? [indent(hooks.prelude, "    ")] : []),
    "    Solution oc_sol;",
    isVoid ? `    oc_sol.${sig.method}(${args});` : `    ${typeOf(sig.returns).cpp} oc_res = oc_sol.${sig.method}(${args});`,
    ...(hooks.post ? [indent(hooks.post, "    ")] : []),
    "    oncode::Writer oc_out;",
    `    oc_out.write(${printed});`,
    "    oc_out.line();",
    "    oc_out.flush();",
    "    return 0;",
    "}",
  ].join("\n");
};

const javaDriver = (sig, hooks = {}) => {
  const reads = sig.params.map((p) => indent(typeOf(p.type).javaRead(p.name, p), "        ")).join("\n");
  const args = userParams(sig).map((p) => p.name).join(", ");
  const isVoid = sig.returns === "void";
  const printed = isVoid
    ? typeOf(sig.params.find((p) => p.name === sig.printParam).type).javaOut(sig.printParam)
    : typeOf(sig.returns).javaOut("oc_res");
  const used = needs(sig);
  return [
    "import java.util.*;",
    "import java.io.*;",
    "",
    "{{USER_CODE}}",
    "",
    ...used.map((n) => structs[n].javaClass + "\n"),
    "public class Main {",
    IO_JAVA,
    ...used.map((n) => "\n" + structs[n].javaHelpers),
    "",
    "    public static void main(String[] oc_args) throws IOException {",
    "        initInput();",
    reads,
    "        endInput();",
    ...(hooks.prelude ? [indent(hooks.prelude, "        ")] : []),
    isVoid ? `        new Solution().${sig.method}(${args});` : `        ${typeOf(sig.returns).java} oc_res = new Solution().${sig.method}(${args});`,
    ...(hooks.post ? [indent(hooks.post, "        ")] : []),
    `        write(${printed});`,
    "        OUT.append('\\n');",
    "        flushOutput();",
    "    }",
    "}",
  ].join("\n");
};

const generate = (spec) => {
  if (spec.drivers) return spec.drivers(); // hand-written drivers (design problems, clone graph, ...)
  checkSignature(spec.signature);
  return {
    cpp: {
      userSnippet: cppStarter(spec.signature),
      driverCode: cppDriver(spec.signature, { post: spec.post?.cpp, prelude: spec.prelude?.cpp }),
    },
    java: {
      userSnippet: javaStarter(spec.signature),
      driverCode: javaDriver(spec.signature, { post: spec.post?.java, prelude: spec.prelude?.java }),
    },
  };
};

module.exports = { TYPES, IO_CPP, IO_JAVA, structs, generate, checkSignature, indent };
