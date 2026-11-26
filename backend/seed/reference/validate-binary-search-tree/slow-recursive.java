// Informational: the usual recursive range check, to confirm the deepest test fits the JVM stack.
class Solution {
    private boolean check(TreeNode n, long low, long high) {
        if (n == null) return true;
        if (n.val <= low || n.val >= high) return false;
        return check(n.left, low, n.val) && check(n.right, n.val, high);
    }

    public boolean isValidBST(TreeNode root) {
        return check(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
}
