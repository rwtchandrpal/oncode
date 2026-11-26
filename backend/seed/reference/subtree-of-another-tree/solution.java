class Solution {
    // Serialise both trees with explicit null markers and look for one string inside the other.
    private void serialize(TreeNode root, StringBuilder sb) {
        // iterative preorder that also emits null markers; the leading comma stops "2" matching "12"
        List<TreeNode> order = new ArrayList<>();
        order.add(root);
        while (!order.isEmpty()) {
            TreeNode n = order.remove(order.size() - 1);
            if (n == null) { sb.append(",#"); continue; }
            sb.append(',').append(n.val);
            order.add(n.right);
            order.add(n.left);
        }
    }

    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        StringBuilder a = new StringBuilder(), b = new StringBuilder();
        serialize(root, a);
        serialize(subRoot, b);
        return a.toString().contains(b.toString());
    }
}
