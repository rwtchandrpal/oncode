class Solution {
    // Same idea, written with a BFS order processed in reverse and a gain field per node via a map.
    public int maxPathSum(TreeNode root) {
        List<TreeNode> order = new ArrayList<>();
        order.add(root);
        for (int i = 0; i < order.size(); i++) {
            TreeNode n = order.get(i);
            if (n.left != null) order.add(n.left);
            if (n.right != null) order.add(n.right);
        }
        Map<TreeNode, Integer> gain = new IdentityHashMap<>();
        int best = Integer.MIN_VALUE;
        for (int i = order.size() - 1; i >= 0; i--) {
            TreeNode n = order.get(i);
            int l = n.left == null ? 0 : Math.max(0, gain.get(n.left));
            int r = n.right == null ? 0 : Math.max(0, gain.get(n.right));
            best = Math.max(best, n.val + l + r);
            gain.put(n, n.val + Math.max(l, r));
        }
        return best;
    }
}
