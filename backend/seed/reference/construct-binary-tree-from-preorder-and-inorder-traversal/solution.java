class Solution {
    // Iterative stack-based construction (the C++ reference is recursive with an index map).
    public TreeNode buildTree(int[] preorder, int[] inorder) {
        TreeNode root = new TreeNode(preorder[0]);
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        int in = 0;
        for (int i = 1; i < preorder.length; i++) {
            TreeNode node = new TreeNode(preorder[i]);
            TreeNode parent = stack.peek();
            if (parent.val != inorder[in]) {
                parent.left = node; // still going down the left side
            } else {
                // climb while the stack top is the next in-order value; attach as right child
                while (!stack.isEmpty() && stack.peek().val == inorder[in]) {
                    parent = stack.pop();
                    in++;
                }
                parent.right = node;
            }
            stack.push(node);
        }
        return root;
    }
}
