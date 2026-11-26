class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        // Walk down from the root: while both targets are on the same side, follow that side.
        TreeNode* cur = root;
        while (cur) {
            if (p->val < cur->val && q->val < cur->val) cur = cur->left;
            else if (p->val > cur->val && q->val > cur->val) cur = cur->right;
            else return cur;  // they split here (or one of them is cur)
        }
        return nullptr;
    }
};
