class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        // Iterative in-order traversal, stopping at the k-th visited node.
        vector<TreeNode*> stack;
        TreeNode* cur = root;
        while (cur || !stack.empty()) {
            while (cur) {
                stack.push_back(cur);
                cur = cur->left;
            }
            cur = stack.back();
            stack.pop_back();
            if (--k == 0) return cur->val;
            cur = cur->right;
        }
        return -1;
    }
};
