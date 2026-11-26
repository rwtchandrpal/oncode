class Solution {
    // Iterative BFS (the C++ reference is recursive).
    public TreeNode invertTree(TreeNode root) {
        ArrayDeque<TreeNode> queue = new ArrayDeque<>();
        if (root != null) queue.add(root);
        while (!queue.isEmpty()) {
            TreeNode n = queue.poll();
            TreeNode t = n.left;
            n.left = n.right;
            n.right = t;
            if (n.left != null) queue.add(n.left);
            if (n.right != null) queue.add(n.right);
        }
        return root;
    }
}
