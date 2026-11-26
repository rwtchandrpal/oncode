const { IO_CPP, IO_JAVA } = require("../tools/lib/codegen");

const userCpp = `class Solution {
public:
    // Encodes a list of strings to a single string.
    string encode(vector<string>& strs) {
        return "";
    }

    // Decodes a single string back to the list of strings.
    vector<string> decode(string s) {
        return {};
    }
};`;

const userJava = `class Solution {
    // Encodes a list of strings to a single string.
    public String encode(List<String> strs) {
        return "";
    }

    // Decodes a single string back to the list of strings.
    public List<String> decode(String str) {
        return new ArrayList<>();
    }
}`;

// encode() and decode() run on two different Solution objects; the decoded list is printed.
const driverCpp = `#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

${IO_CPP}

int main() {
    oncode::Reader oc_in;
    vector<string> strs;
    oc_in.read(strs);
    oc_in.end();
    vector<string> oc_copy = strs;
    Solution* oc_a = new Solution();
    string oc_encoded = oc_a->encode(oc_copy);
    Solution* oc_b = new Solution();
    vector<string> oc_res = oc_b->decode(oc_encoded);
    oncode::Writer oc_out;
    oc_out.write(oc_res);
    oc_out.line();
    oc_out.flush();
    return 0;
}`;

const driverJava = `import java.util.*;
import java.io.*;

{{USER_CODE}}

public class Main {
${IO_JAVA}

    public static void main(String[] oc_args) throws IOException {
        initInput();
        List<String> strs = readStringList();
        endInput();
        String oc_encoded = new Solution().encode(new ArrayList<>(strs));
        List<String> oc_res = new Solution().decode(oc_encoded);
        write(oc_res);
        OUT.append('\\n');
        flushOutput();
    }
}`;

module.exports = {
  slug: "encode-and-decode-strings",
  signature: { method: "roundTrip", params: [{ name: "strs", type: "List<string>" }], returns: "List<string>" },
  drivers: () => ({
    cpp: { userSnippet: userCpp, driverCode: driverCpp },
    java: { userSnippet: userJava, driverCode: driverJava },
  }),
  description: `
Design a way to pack a **list of strings** into a **single string** and unpack it again. Implement:

- \`encode(strs)\`: turns the list into one string.
- \`decode(s)\`: turns a string produced by \`encode\` back into the original list.

The strings may contain **any** printable character, including whatever separator you might be tempted to use (commas, \`#\`, digits, spaces), and may be empty. The list itself may be empty.

**Test format:** the judge calls \`encode\` on one object and \`decode\` on a **different** object, then prints the decoded list. It must equal the input list exactly.
`,
  constraints: [
    "0 <= strs.length < 200",
    "0 <= strs[i].length < 200",
    "strs[i] consists of printable ASCII characters (codes 32 to 126)",
  ],
  examples: [
    { explanation: "Each string comes back unchanged and in order." },
    { explanation: "An empty list must decode to an empty list, not to a list holding one empty string." },
    { explanation: "Strings that look like length prefixes or separators must survive as well." },
  ],
  notes: "Custom driver: encode and decode run on different Solution objects.",
};
