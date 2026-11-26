// Wrong: swaps only the root's children.
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (root) swap(root->left, root->right);
        return root;
    }
};
