// Wrong: follows only left children.
class Solution {
public:
    int maxDepth(TreeNode* root) {
        int d = 0;
        for (; root; root = root->left) d++;
        return d;
    }
};
