class Solution {
public:
    int maxPathSum(TreeNode* root) {
        // Post-order without recursion: gain[n] = best downward path starting at n (never below 0 for parents).
        vector<TreeNode*> order, stack = {root};
        while (!stack.empty()) {
            TreeNode* n = stack.back();
            stack.pop_back();
            order.push_back(n);
            if (n->left) stack.push_back(n->left);
            if (n->right) stack.push_back(n->right);
        }
        unordered_map<TreeNode*, int> gain;
        int best = INT_MIN;
        for (int i = (int)order.size() - 1; i >= 0; i--) {  // children before parents
            TreeNode* n = order[i];
            int l = n->left ? max(0, gain[n->left]) : 0;
            int r = n->right ? max(0, gain[n->right]) : 0;
            best = max(best, n->val + l + r);  // path that turns at n
            gain[n] = n->val + max(l, r);
        }
        return best;
    }
};
