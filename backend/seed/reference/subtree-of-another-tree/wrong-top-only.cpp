// Wrong: accepts a match once subRoot runs out, even if root's subtree continues below.
class Solution {
    bool covers(TreeNode* a, TreeNode* b) {
        if (!b) return true;
        if (!a) return false;
        return a->val == b->val && covers(a->left, b->left) && covers(a->right, b->right);
    }
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        if (!root) return false;
        return covers(root, subRoot) || isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
    }
};
