// Wrong: only considers paths that pass through the root.
class Solution {
    int down(TreeNode* n) {
        if (!n) return 0;
        return max(0, n->val + max(down(n->left), down(n->right)));
    }
public:
    int maxPathSum(TreeNode* root) { return root->val + down(root->left) + down(root->right); }
};
