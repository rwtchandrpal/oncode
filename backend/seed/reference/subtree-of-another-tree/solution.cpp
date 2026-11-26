class Solution {
    bool same(TreeNode* a, TreeNode* b) {
        if (!a || !b) return a == b;
        return a->val == b->val && same(a->left, b->left) && same(a->right, b->right);
    }
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        // try every node of root as the top of the match (O(m * n), fine for these sizes)
        vector<TreeNode*> stack = {root};
        while (!stack.empty()) {
            TreeNode* n = stack.back();
            stack.pop_back();
            if (!n) continue;
            if (n->val == subRoot->val && same(n, subRoot)) return true;
            stack.push_back(n->left);
            stack.push_back(n->right);
        }
        return false;
    }
};
