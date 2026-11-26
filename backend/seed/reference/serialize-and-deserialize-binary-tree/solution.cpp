class Codec {
public:
    // Preorder with '#' for missing children, comma-separated; iterative to handle deep trees.
    string serialize(TreeNode* root) {
        string out;
        vector<TreeNode*> stack = {root};
        while (!stack.empty()) {
            TreeNode* n = stack.back();
            stack.pop_back();
            if (!out.empty()) out += ',';
            if (!n) { out += '#'; continue; }
            out += to_string(n->val);
            stack.push_back(n->right);
            stack.push_back(n->left);
        }
        return out;
    }

    TreeNode* deserialize(string data) {
        vector<string> tokens;
        string cur;
        for (char c : data) {
            if (c == ',') { tokens.push_back(cur); cur.clear(); }
            else cur += c;
        }
        tokens.push_back(cur);
        // Rebuild in the same preorder: each slot is a pointer to where the next node goes.
        TreeNode* root = nullptr;
        vector<TreeNode**> slots = {&root};
        for (const string& t : tokens) {
            TreeNode** slot = slots.back();
            slots.pop_back();
            if (t == "#") continue;
            *slot = new TreeNode(stoi(t));
            slots.push_back(&(*slot)->right);
            slots.push_back(&(*slot)->left);
        }
        return root;
    }
};
