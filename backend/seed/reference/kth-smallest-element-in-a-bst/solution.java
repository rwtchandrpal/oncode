class Solution {
    // Morris in-order traversal: O(1) extra space (the C++ reference uses a stack).
    public int kthSmallest(TreeNode root, int k) {
        TreeNode cur = root;
        int answer = -1;
        while (cur != null) {
            if (cur.left == null) {
                if (--k == 0) answer = cur.val;
                cur = cur.right;
            } else {
                TreeNode pred = cur.left;
                while (pred.right != null && pred.right != cur) pred = pred.right;
                if (pred.right == null) {
                    pred.right = cur; // thread back to cur
                    cur = cur.left;
                } else {
                    pred.right = null; // remove the thread
                    if (--k == 0) answer = cur.val;
                    cur = cur.right;
                }
            }
        }
        return answer;
    }
}
