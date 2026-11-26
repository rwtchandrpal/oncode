class Solution {
    // Iterative: walk both trees in lockstep with a queue of node pairs.
    public boolean isSameTree(TreeNode p, TreeNode q) {
        List<TreeNode[]> queue = new ArrayList<>();
        queue.add(new TreeNode[] {p, q});
        for (int i = 0; i < queue.size(); i++) {
            TreeNode a = queue.get(i)[0], b = queue.get(i)[1];
            if (a == null && b == null) continue;
            if (a == null || b == null || a.val != b.val) return false;
            queue.add(new TreeNode[] {a.left, b.left});
            queue.add(new TreeNode[] {a.right, b.right});
        }
        return true;
    }
}
