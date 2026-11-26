// Wrong: ignores inorder and hangs every preorder value as a left child.
class Solution {
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        (void)inorder;
        TreeNode* root = new TreeNode(preorder[0]);
        TreeNode* cur = root;
        for (size_t i = 1; i < preorder.size(); i++) {
            cur->left = new TreeNode(preorder[i]);
            cur = cur->left;
        }
        return root;
    }
};
