class Solution {
public:
    bool isValidBST(TreeNode* root) {
        // In-order traversal must be strictly increasing. 64-bit sentinel avoids clashing with INT_MIN.
        vector<TreeNode*> stack;
        long long prev = LLONG_MIN;
        TreeNode* cur = root;
        while (cur || !stack.empty()) {
            while (cur) {
                stack.push_back(cur);
                cur = cur->left;
            }
            cur = stack.back();
            stack.pop_back();
            if ((long long)cur->val <= prev) return false;
            prev = cur->val;
            cur = cur->right;
        }
        return true;
    }
};
