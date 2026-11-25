// Self-test for the shared driver I/O library (tools/lib/io.cpp, io.java) on Judge0.
// 1. Round trip: every supported type is read from messy-but-valid input and printed canonically.
// 2. Rejection: malformed input must end in a runtime error, never in a quiet wrong parse.
// Usage (from backend/): node seed/tools/io-selftest.js
const { IO_CPP, IO_JAVA } = require("./lib/codegen");
const { run, canon, ensureJudge0 } = require("./lib/judge");

const ROUND_TRIP_INPUT = [
  "  -2147483648",
  "9007199254740993",
  "true",
  " false ",
  '"he said \\"hi\\" \\\\ back"',
  '"x"',
  "[ 1, -2 ,3 ]",
  "[]",
  '["a","",  "b\\\\\\"c"]',
  "[[1,2],[],[-3]]",
  '[["a","b"],["c","d"]]',
  "[[]]",
  "2147483647",
].join("\r\n");

const ROUND_TRIP_EXPECTED = [
  "-2147483648",
  "9007199254740993",
  "true",
  "false",
  '"he said \\"hi\\" \\\\ back"',
  '"x"',
  "[1,-2,3]",
  "[]",
  '["a","","b\\\\\\"c"]',
  "[[1,2],[],[-3]]",
  '[["a","b"],["c","d"]]',
  "[[]]",
  "2147483647",
].join("\n");

const CPP_ROUND_TRIP = `#include <bits/stdc++.h>
using namespace std;
${IO_CPP}
int main() {
    oncode::Reader in;
    oncode::Writer out;
    int a; long long b; bool c, d; string e; char f; vector<int> g, h; vector<string> i;
    vector<vector<int>> j, l; vector<vector<char>> k; int m;
    in.read(a); in.read(b); in.read(c); in.read(d); in.read(e); in.read(f); in.read(g); in.read(h);
    in.read(i); in.read(j); in.read(k); in.read(l); in.read(m); in.end();
    out.write(a); out.line(); out.write(b); out.line(); out.write(c); out.line(); out.write(d); out.line();
    out.write(e); out.line(); out.write(f); out.line(); out.write(g); out.line(); out.write(h); out.line();
    out.write(i); out.line(); out.write(j); out.line(); out.write(k); out.line(); out.write(l); out.line();
    out.write(m); out.line();
    out.flush();
    return 0;
}`;

const JAVA_ROUND_TRIP = `import java.util.*;
import java.io.*;
public class Main {
${IO_JAVA}
    public static void main(String[] args) throws IOException {
        initInput();
        Object[] vals = { readInt(), readLong(), readBool(), readBool(), readString(), readChar(), readIntArray(),
            readIntList(), readStringArray(), readIntMatrix(), readCharMatrix(), readIntListList(), readInt() };
        endInput();
        for (Object v : vals) { write(v); OUT.append('\\n'); }
        flushOutput();
    }
}`;

// Reads an int[] then an int, prints both.
const CPP_STRICT = `#include <bits/stdc++.h>
using namespace std;
${IO_CPP}
int main() {
    oncode::Reader in; oncode::Writer out;
    vector<int> a; int b; in.read(a); in.read(b); in.end();
    out.write(a); out.line(); out.write(b); out.line(); out.flush();
    return 0;
}`;
const JAVA_STRICT = `import java.util.*;
import java.io.*;
public class Main {
${IO_JAVA}
    public static void main(String[] args) throws IOException {
        initInput();
        int[] a = readIntArray(); int b = readInt(); endInput();
        write(a); OUT.append('\\n'); write(b); OUT.append('\\n'); flushOutput();
    }
}`;
const STRICT_CASES = [
  { name: "valid", input: "[1,2]\n3", ok: "[1,2]\n3" },
  { name: "unterminated array", input: "[1,2\n3" },
  { name: "int overflow", input: "[1,2]\n2147483648" },
  { name: "trailing input", input: "[1,2]\n3\n4" },
  { name: "empty element", input: "[1,,2]\n3" },
  { name: "missing value", input: "[1,2]" },
  { name: "not a number", input: "[1,2]\nx" },
];

(async () => {
  await ensureJudge0();
  let failures = 0;
  const report = (ok, label, detail = "") => {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  " + detail : ""}`);
  };

  for (const [language, code] of [["cpp", CPP_ROUND_TRIP], ["java", JAVA_ROUND_TRIP]]) {
    const [r] = await run({ language, driverCode: "{{USER_CODE}}", code, testCases: [{ input: ROUND_TRIP_INPUT, expectedOutput: ROUND_TRIP_EXPECTED }] });
    report(r.statusId === 3 && canon(r.stdout) === ROUND_TRIP_EXPECTED, `${language} round trip`,
      r.statusId === 3 ? "" : `${r.status} ${r.compileOutput || r.stderr || JSON.stringify(r.stdout)}`);
  }
  for (const [language, code] of [["cpp", CPP_STRICT], ["java", JAVA_STRICT]]) {
    const res = await run({ language, driverCode: "{{USER_CODE}}", code, testCases: STRICT_CASES.map((c) => ({ input: c.input, expectedOutput: c.ok || "" })) });
    res.forEach((r, i) => {
      const c = STRICT_CASES[i];
      const ok = c.ok ? r.statusId === 3 : r.statusId >= 7 && r.statusId <= 12; // runtime error statuses
      report(ok, `${language} ${c.name}`, `${r.status}${c.ok ? "" : " (expected a runtime error)"}`);
    });
  }
  console.log(failures ? `\n${failures} failure(s)` : "\nAll I/O self-tests passed.");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
