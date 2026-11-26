class Codec {
    // Level order with "n" for null, space-separated (the C++ reference uses preorder).
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        List<TreeNode> queue = new ArrayList<>();
        queue.add(root);
        for (int i = 0; i < queue.size(); i++) {
            TreeNode n = queue.get(i);
            if (sb.length() > 0) sb.append(' ');
            if (n == null) { sb.append('n'); continue; }
            sb.append(n.val);
            queue.add(n.left);
            queue.add(n.right);
        }
        return sb.toString();
    }

    public TreeNode deserialize(String data) {
        String[] t = data.split(" ");
        if (t[0].equals("n")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(t[0]));
        List<TreeNode> queue = new ArrayList<>();
        queue.add(root);
        int i = 1;
        for (int h = 0; h < queue.size(); h++) {
            TreeNode n = queue.get(h);
            if (!t[i].equals("n")) { n.left = new TreeNode(Integer.parseInt(t[i])); queue.add(n.left); }
            i++;
            if (!t[i].equals("n")) { n.right = new TreeNode(Integer.parseInt(t[i])); queue.add(n.right); }
            i++;
        }
        return root;
    }
}
