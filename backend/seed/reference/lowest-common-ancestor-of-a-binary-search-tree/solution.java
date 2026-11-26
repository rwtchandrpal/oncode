class Solution {
    // Records the search path to each node, then takes the last node the two paths share.
    private List<TreeNode> path(TreeNode root, TreeNode target) {
        List<TreeNode> path = new ArrayList<>();
        TreeNode cur = root;
        while (cur != null) {
            path.add(cur);
            if (cur == target) break;
            cur = target.val < cur.val ? cur.left : cur.right;
        }
        return path;
    }

    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        List<TreeNode> a = path(root, p), b = path(root, q);
        TreeNode lca = null;
        for (int i = 0; i < Math.min(a.size(), b.size()) && a.get(i) == b.get(i); i++) lca = a.get(i);
        return lca;
    }
}
