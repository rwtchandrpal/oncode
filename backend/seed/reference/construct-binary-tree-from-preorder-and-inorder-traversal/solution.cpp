class Solution {
    unordered_map<int, int> pos;  // value -> index in inorder
    int next = 0;                 // next preorder index to use
    TreeNode* build(const vector<int>& pre, int lo, int hi) {  // inorder range [lo, hi]
        if (lo > hi) return nullptr;
        TreeNode* root = new TreeNode(pre[next++]);
        int mid = pos[root->val];
        root->left = build(pre, lo, mid - 1);
        root->right = build(pre, mid + 1, hi);
        return root;
    }
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        for (int i = 0; i < (int)inorder.size(); i++) pos[inorder[i]] = i;
        next = 0;
        return build(preorder, 0, (int)inorder.size() - 1);
    }
};
