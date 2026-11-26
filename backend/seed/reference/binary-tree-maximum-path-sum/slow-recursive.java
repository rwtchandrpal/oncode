// Informational: the usual recursive solution, to confirm the deepest test fits the JVM stack.
class Solution {
    private int best = Integer.MIN_VALUE;

    private int gain(TreeNode n) {
        if (n == null) return 0;
        int l = Math.max(0, gain(n.left));
        int r = Math.max(0, gain(n.right));
        best = Math.max(best, n.val + l + r);
        return n.val + Math.max(l, r);
    }

    public int maxPathSum(TreeNode root) {
        gain(root);
        return best;
    }
}
