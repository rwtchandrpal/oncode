// Wrong: stores only the values in level order, without null markers, so the shape is lost.
class Codec {
public:
    string serialize(TreeNode* root) {
        string out;
        queue<TreeNode*> q;
        if (root) q.push(root);
        while (!q.empty()) {
            TreeNode* n = q.front();
            q.pop();
            out += to_string(n->val) + ",";
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        return out;
    }
    TreeNode* deserialize(string data) {
        vector<int> vals;
        string cur;
        for (char c : data) {
            if (c == ',') { vals.push_back(stoi(cur)); cur.clear(); }
            else cur += c;
        }
        if (vals.empty()) return nullptr;
        vector<TreeNode*> nodes;
        for (int v : vals) nodes.push_back(new TreeNode(v));
        for (size_t i = 0; i < nodes.size(); i++) {  // assumes a complete tree
            if (2 * i + 1 < nodes.size()) nodes[i]->left = nodes[2 * i + 1];
            if (2 * i + 2 < nodes.size()) nodes[i]->right = nodes[2 * i + 2];
        }
        return nodes[0];
    }
};
