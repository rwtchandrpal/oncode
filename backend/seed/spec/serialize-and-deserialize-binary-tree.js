const { IO_CPP, IO_JAVA, structs } = require("../tools/lib/codegen");

const userCpp = `${structs.tree.cppDoc}

class Codec {
public:
    // Encodes a tree to a single string.
    string serialize(TreeNode* root) {
        return "";
    }

    // Decodes your encoded data to a tree.
    TreeNode* deserialize(string data) {
        return nullptr;
    }
};`;

const userJava = `${structs.tree.javaDoc}

class Codec {
    // Encodes a tree to a single string.
    public String serialize(TreeNode root) {
        return "";
    }

    // Decodes your encoded data to a tree.
    public TreeNode deserialize(String data) {
        return null;
    }
}`;

// Round trip through two separate Codec objects; reject a result that reuses the original nodes.
const driverCpp = `#include <bits/stdc++.h>
using namespace std;

${structs.tree.cppHeader}

{{USER_CODE}}

${IO_CPP}

${structs.tree.cppHelpers}

int main() {
    oncode::Reader oc_in;
    vector<oncode::Opt> oc_v_root;
    oc_in.read(oc_v_root);
    oc_in.end();
    TreeNode* root = oncode::buildTree(oc_v_root);
    unordered_set<TreeNode*> oc_original;
    vector<TreeNode*> oc_st;
    if (root) oc_st.push_back(root);
    while (!oc_st.empty()) {
        TreeNode* n = oc_st.back();
        oc_st.pop_back();
        oc_original.insert(n);
        if (n->left) oc_st.push_back(n->left);
        if (n->right) oc_st.push_back(n->right);
    }
    Codec* oc_ser = new Codec();
    Codec* oc_deser = new Codec();
    string oc_data = oc_ser->serialize(root);
    TreeNode* oc_res = oc_deser->deserialize(oc_data);
    oncode::Writer oc_out;
    bool oc_reused = false;
    vector<TreeNode*> oc_check;
    if (oc_res) oc_check.push_back(oc_res);
    size_t oc_seen = 0;
    while (!oc_check.empty() && !oc_reused && oc_seen <= 400000) {
        TreeNode* n = oc_check.back();
        oc_check.pop_back();
        oc_seen++;
        if (oc_original.count(n)) oc_reused = true;
        if (n->left) oc_check.push_back(n->left);
        if (n->right) oc_check.push_back(n->right);
    }
    if (oc_reused) oc_out.write(string("deserialize returned nodes of the original tree"));
    else oc_out.write(oncode::treeOut(oc_res));
    oc_out.line();
    oc_out.flush();
    return 0;
}`;

const driverJava = `import java.util.*;
import java.io.*;

{{USER_CODE}}

${structs.tree.javaClass}

public class Main {
${IO_JAVA}

${structs.tree.javaHelpers}

    public static void main(String[] oc_args) throws IOException {
        initInput();
        TreeNode root = buildTree(readNullableIntList());
        endInput();
        Set<TreeNode> oc_original = Collections.newSetFromMap(new IdentityHashMap<>());
        Deque<TreeNode> oc_st = new ArrayDeque<>();
        if (root != null) oc_st.push(root);
        while (!oc_st.isEmpty()) {
            TreeNode n = oc_st.pop();
            oc_original.add(n);
            if (n.left != null) oc_st.push(n.left);
            if (n.right != null) oc_st.push(n.right);
        }
        Codec oc_ser = new Codec();
        Codec oc_deser = new Codec();
        TreeNode oc_res = oc_deser.deserialize(oc_ser.serialize(root));
        boolean oc_reused = false;
        Deque<TreeNode> oc_check = new ArrayDeque<>();
        if (oc_res != null) oc_check.push(oc_res);
        int oc_seen = 0;
        while (!oc_check.isEmpty() && !oc_reused && oc_seen <= 400000) {
            TreeNode n = oc_check.pop();
            oc_seen++;
            if (oc_original.contains(n)) oc_reused = true;
            if (n.left != null) oc_check.push(n.left);
            if (n.right != null) oc_check.push(n.right);
        }
        if (oc_reused) write("deserialize returned nodes of the original tree");
        else write(treeOut(oc_res));
        OUT.append('\\n');
        flushOutput();
    }
}`;

module.exports = {
  slug: "serialize-and-deserialize-binary-tree",
  signature: { method: "codec", params: [{ name: "root", type: "TreeNode" }], returns: "TreeNode" },
  drivers: () => ({
    cpp: { userSnippet: userCpp, driverCode: driverCpp },
    java: { userSnippet: userJava, driverCode: driverJava },
  }),
  description: `
Design a way to turn a binary tree into a **string** and back. Implement the class \`Codec\`:

- \`string serialize(root)\` encodes the tree rooted at \`root\` as a string, in any format you like.
- \`TreeNode deserialize(data)\` rebuilds the tree from a string produced by your \`serialize\`.

Your encoding only has to work with your own decoder. The tree you return must be a **new** tree with the same shape and values; it must not reuse the original nodes.

**Test format:** the judge builds the input tree (given in level order), calls \`serialize\` on one \`Codec\` object and \`deserialize\` on a **different** \`Codec\` object, and prints the resulting tree in level order. The output should equal the input.
`,
  constraints: ["The number of nodes is between 0 and 10^4", "-1000 <= Node.val <= 1000"],
  examples: [
    { explanation: "The rebuilt tree has the same shape and values as the original." },
    { explanation: "The empty tree must survive the round trip too." },
    { explanation: "Negative values and gaps (null children) must be kept in the right places." },
  ],
  notes: "Custom driver: round trip through two Codec objects; reuse of the original nodes is rejected.",
};
