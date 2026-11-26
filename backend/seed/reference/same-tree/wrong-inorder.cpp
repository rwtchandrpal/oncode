// Wrong: compares only the in-order value sequences, which ignores the shape.
class Solution {
    void walk(TreeNode* n, vector<int>& out) {
        if (!n) return;
        walk(n->left, out);
        out.push_back(n->val);
        walk(n->right, out);
    }
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        vector<int> a, b;
        walk(p, a);
        walk(q, b);
        return a == b;
    }
};
