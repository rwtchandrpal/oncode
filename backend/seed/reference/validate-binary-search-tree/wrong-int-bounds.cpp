// Wrong: uses INT_MIN / INT_MAX as open bounds, so a node holding INT_MAX (or INT_MIN) is rejected.
class Solution {
    bool check(TreeNode* n, int low, int high) {
        if (!n) return true;
        if (n->val <= low || n->val >= high) return false;
        return check(n->left, low, n->val) && check(n->right, n->val, high);
    }
public:
    bool isValidBST(TreeNode* root) { return check(root, INT_MIN, INT_MAX); }
};
