class Solution {
    // Each node must lie strictly inside the (low, high) range set by its ancestors (long bounds).
    public boolean isValidBST(TreeNode root) {
        Deque<Object[]> stack = new ArrayDeque<>();
        stack.push(new Object[] {root, Long.MIN_VALUE, Long.MAX_VALUE});
        while (!stack.isEmpty()) {
            Object[] item = stack.pop();
            TreeNode n = (TreeNode) item[0];
            if (n == null) continue;
            long low = (Long) item[1], high = (Long) item[2];
            if (n.val <= low || n.val >= high) return false;
            stack.push(new Object[] {n.left, low, (long) n.val});
            stack.push(new Object[] {n.right, (long) n.val, high});
        }
        return true;
    }
}
