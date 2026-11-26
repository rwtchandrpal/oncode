class Solution {
    // Recursive DFS with a memo map (the C++ reference is BFS).
    private final Map<Node, Node> copies = new HashMap<>();

    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Node existing = copies.get(node);
        if (existing != null) return existing;
        Node clone = new Node(node.val);
        copies.put(node, clone);
        for (Node nb : node.neighbors) clone.neighbors.add(cloneGraph(nb));
        return clone;
    }
}
