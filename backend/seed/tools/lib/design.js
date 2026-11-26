// Drivers and starters for "design" problems (Implement Trie, Find Median, ...).
// Test input is two lines: the operation names and their argument lists, LeetCode style:
//   ["Trie","insert","search"]
//   [[],["apple"],["apple"]]
// The first operation constructs the object. The driver replays every operation and prints one
// array with each call's result: null for constructors and void methods, otherwise the return value.
//
// spec.design = { className, argType: "string" | "int", methods: [{ name, params: [names], returns }] }
// returns: "void" | "bool" | "int" | "double" (double results are medians: printed with one decimal).
const { IO_CPP, IO_JAVA } = require("./codegen");

const T = {
  string: { cpp: "string", java: "String", javaList: "readStringListList()", javaElem: "String" },
  int: { cpp: "int", java: "int", javaList: "readIntListList()", javaElem: "Integer" },
};
const RET = {
  void: { cpp: "void", java: "void", cppDefault: null, javaDefault: null },
  bool: { cpp: "bool", java: "boolean", cppDefault: "false", javaDefault: "false" },
  int: { cpp: "int", java: "int", cppDefault: "0", javaDefault: "0" },
  double: { cpp: "double", java: "double", cppDefault: "0.0", javaDefault: "0.0" },
};

const starterCpp = (d) => {
  const t = T[d.argType].cpp;
  const lines = ["class " + d.className + " {", "public:", `    ${d.className}() {`, "        ", "    }"];
  for (const m of d.methods) {
    const r = RET[m.returns];
    lines.push("", `    ${r.cpp} ${m.name}(${m.params.map((p) => `${t} ${p}`).join(", ")}) {`);
    lines.push(r.cppDefault === null ? "        " : `        return ${r.cppDefault};`, "    }");
  }
  lines.push("};");
  return lines.join("\n");
};

const starterJava = (d) => {
  const t = T[d.argType].java;
  const lines = ["class " + d.className + " {", "", `    public ${d.className}() {`, "        ", "    }"];
  for (const m of d.methods) {
    const r = RET[m.returns];
    lines.push("", `    public ${r.java} ${m.name}(${m.params.map((p) => `${t} ${p}`).join(", ")}) {`);
    lines.push(r.javaDefault === null ? "        " : `        return ${r.javaDefault};`, "    }");
  }
  lines.push("}");
  return lines.join("\n");
};

// Medians are exact multiples of 0.5; print them as e.g. -2.5 or 3.0. Anything else is printed
// with 6 decimals, so it cannot match a correct answer by accident.
const CPP_HALF = `namespace oncode {
void writeHalf(Writer& w, double m) {
    long long t = llround(m * 2);
    if (std::fabs(m * 2 - (double)t) > 1e-6) {
        char buf[64];
        std::snprintf(buf, sizeof buf, "%.6f", m);
        w.out += buf;
        return;
    }
    if (t < 0) { w.out += '-'; t = -t; }
    w.out += std::to_string(t / 2);
    w.out += (t % 2) ? ".5" : ".0";
}
}  // namespace oncode`;

const JAVA_HALF = `    static void writeHalf(double m) {
        long t = Math.round(m * 2);
        if (Math.abs(m * 2 - t) > 1e-6) { OUT.append(String.format(java.util.Locale.ROOT, "%.6f", m)); return; }
        if (t < 0) { OUT.append('-'); t = -t; }
        OUT.append(t / 2).append(t % 2 != 0 ? ".5" : ".0");
    }`;

const driverCpp = (d) => {
  const t = T[d.argType].cpp;
  const branches = d.methods.map((m) => {
    const call = `oc_obj->${m.name}(${m.params.map((_, i) => `oc_a.at(${i})`).join(", ")})`;
    const body =
      m.returns === "void" ? `${call}; oc_out.out += "null";`
      : m.returns === "double" ? `oncode::writeHalf(oc_out, ${call});`
      : m.returns === "bool" ? `oc_out.write((bool)${call});`
      : `oc_out.write((int)${call});`;
    return `        else if (oc_op == "${m.name}") { ${body} }`;
  });
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "{{USER_CODE}}",
    "",
    IO_CPP,
    "",
    CPP_HALF,
    "",
    "int main() {",
    "    oncode::Reader oc_in;",
    "    vector<string> oc_ops;",
    "    oc_in.read(oc_ops);",
    `    vector<vector<${t}>> oc_args;`,
    "    oc_in.read(oc_args);",
    "    oc_in.end();",
    "    if (oc_ops.size() != oc_args.size()) { cerr << \"driver: operations and arguments differ in length\\n\"; return 3; }",
    "    oncode::Writer oc_out;",
    `    ${d.className}* oc_obj = nullptr;`,
    "    oc_out.out += '[';",
    "    for (size_t oc_i = 0; oc_i < oc_ops.size(); oc_i++) {",
    "        if (oc_i) oc_out.out += ',';",
    "        const string& oc_op = oc_ops[oc_i];",
    `        vector<${t}>& oc_a = oc_args[oc_i];`,
    `        if (oc_op == "${d.className}") { oc_obj = new ${d.className}(); oc_out.out += "null"; }`,
    ...branches,
    "        else { cerr << \"driver: unknown operation \" << oc_op << \"\\n\"; return 3; }",
    "    }",
    "    oc_out.out += ']';",
    "    oc_out.line();",
    "    oc_out.flush();",
    "    return 0;",
    "}",
  ].join("\n");
};

const driverJava = (d) => {
  const t = T[d.argType];
  const branches = d.methods.map((m) => {
    const call = `oc_obj.${m.name}(${m.params.map((_, i) => `oc_a.get(${i})`).join(", ")})`;
    const body =
      m.returns === "void" ? `${call}; OUT.append("null");`
      : m.returns === "double" ? `writeHalf(${call});`
      : `OUT.append(${call});`;
    return `            else if (oc_op.equals("${m.name}")) { ${body} }`;
  });
  return [
    "import java.util.*;",
    "import java.io.*;",
    "",
    "{{USER_CODE}}",
    "",
    "public class Main {",
    IO_JAVA,
    "",
    JAVA_HALF,
    "",
    "    public static void main(String[] oc_args) throws IOException {",
    "        initInput();",
    "        List<String> oc_ops = readStringList();",
    `        List<List<${t.javaElem}>> oc_argv = ${t.javaList};`,
    "        endInput();",
    "        if (oc_ops.size() != oc_argv.size()) throw new IllegalStateException(\"driver: operations and arguments differ in length\");",
    `        ${d.className} oc_obj = null;`,
    "        OUT.append('[');",
    "        for (int oc_i = 0; oc_i < oc_ops.size(); oc_i++) {",
    "            if (oc_i > 0) OUT.append(',');",
    "            String oc_op = oc_ops.get(oc_i);",
    `            List<${t.javaElem}> oc_a = oc_argv.get(oc_i);`,
    `            if (oc_op.equals("${d.className}")) { oc_obj = new ${d.className}(); OUT.append("null"); }`,
    ...branches,
    "            else throw new IllegalStateException(\"driver: unknown operation \" + oc_op);",
    "        }",
    "        OUT.append(']').append('\\n');",
    "        flushOutput();",
    "    }",
    "}",
  ].join("\n");
};

// For spec.drivers: returns the four generated pieces.
const designDrivers = (d) => () => ({
  cpp: { userSnippet: starterCpp(d), driverCode: driverCpp(d) },
  java: { userSnippet: starterJava(d), driverCode: driverJava(d) },
});

// Signature used for serialising the two input lines (and checking their types).
const designSignature = (d) => ({
  method: "design",
  params: [
    { name: "operations", type: "string[]" },
    { name: "arguments", type: d.argType === "string" ? "List<List<string>>" : "List<List<int>>" },
  ],
  returns: "void",
});

module.exports = { designDrivers, designSignature };
