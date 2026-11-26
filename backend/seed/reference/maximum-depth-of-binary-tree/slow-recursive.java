// Informational: the usual recursive solution, to see whether a 10^4-deep chain fits the JVM stack.
class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}
