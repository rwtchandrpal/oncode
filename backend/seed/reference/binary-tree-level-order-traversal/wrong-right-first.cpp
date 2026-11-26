// Wrong: lists each level right to left.
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> levels;
        queue<TreeNode*> q;
        if (root) q.push(root);
        while (!q.empty()) {
            int width = (int)q.size();
            levels.emplace_back();
            for (int i = 0; i < width; i++) {
                TreeNode* n = q.front();
                q.pop();
                levels.back().push_back(n->val);
                if (n->right) q.push(n->right);
                if (n->left) q.push(n->left);
            }
        }
        return levels;
    }
};
