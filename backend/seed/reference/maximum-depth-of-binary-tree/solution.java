class Solution {
    // Iterative DFS with an explicit stack of (node, depth).
    public int maxDepth(TreeNode root) {
        int best = 0;
        Deque<TreeNode> nodes = new ArrayDeque<>();
        Deque<Integer> depths = new ArrayDeque<>();
        if (root != null) { nodes.push(root); depths.push(1); }
        while (!nodes.isEmpty()) {
            TreeNode n = nodes.pop();
            int d = depths.pop();
            best = Math.max(best, d);
            if (n.left != null) { nodes.push(n.left); depths.push(d + 1); }
            if (n.right != null) { nodes.push(n.right); depths.push(d + 1); }
        }
        return best;
    }
}
