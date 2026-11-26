// Wrong: returns the k-th node in level order instead of sorted order.
class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            TreeNode* n = q.front();
            q.pop();
            if (--k == 0) return n->val;
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        return -1;
    }
};
