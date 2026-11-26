class Solution {
public:
    int maxDepth(TreeNode* root) {
        // Level-by-level BFS, so a 10^4-deep chain needs no deep recursion.
        int depth = 0;
        vector<TreeNode*> level;
        if (root) level.push_back(root);
        while (!level.empty()) {
            depth++;
            vector<TreeNode*> next;
            for (TreeNode* n : level) {
                if (n->left) next.push_back(n->left);
                if (n->right) next.push_back(n->right);
            }
            level.swap(next);
        }
        return depth;
    }
};
