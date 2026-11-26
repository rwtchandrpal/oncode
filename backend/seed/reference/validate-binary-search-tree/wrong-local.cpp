// Wrong: only compares each node with its direct children.
class Solution {
public:
    bool isValidBST(TreeNode* root) {
        if (!root) return true;
        if (root->left && root->left->val >= root->val) return false;
        if (root->right && root->right->val <= root->val) return false;
        return isValidBST(root->left) && isValidBST(root->right);
    }
};
