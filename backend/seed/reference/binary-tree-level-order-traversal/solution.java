class Solution {
    // Iterative preorder carrying the depth: each value is appended to its depth's list,
    // and left is visited before right, so every level stays in left-to-right order.
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        Deque<TreeNode> nodes = new ArrayDeque<>();
        Deque<Integer> depths = new ArrayDeque<>();
        if (root != null) { nodes.push(root); depths.push(0); }
        while (!nodes.isEmpty()) {
            TreeNode n = nodes.pop();
            int d = depths.pop();
            if (levels.size() == d) levels.add(new ArrayList<>());
            levels.get(d).add(n.val);
            if (n.right != null) { nodes.push(n.right); depths.push(d + 1); }
            if (n.left != null) { nodes.push(n.left); depths.push(d + 1); }
        }
        return levels;
    }
}
