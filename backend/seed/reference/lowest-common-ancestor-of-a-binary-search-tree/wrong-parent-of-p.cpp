// Wrong: returns p whenever p is not the root, ignoring where q is.
class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        (void)q;
        return p == root ? root : p;
    }
};
