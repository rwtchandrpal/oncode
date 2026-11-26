class Trie {
    // Map-based nodes (the C++ reference uses fixed 26-slot arrays).
    private static class Node {
        Map<Character, Node> next = new HashMap<>();
        boolean word;
    }

    private final Node root = new Node();

    public Trie() {
    }

    private Node walk(String s) {
        Node n = root;
        for (int i = 0; i < s.length() && n != null; i++) n = n.next.get(s.charAt(i));
        return n;
    }

    public void insert(String word) {
        Node n = root;
        for (int i = 0; i < word.length(); i++) n = n.next.computeIfAbsent(word.charAt(i), k -> new Node());
        n.word = true;
    }

    public boolean search(String word) {
        Node n = walk(word);
        return n != null && n.word;
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }
}
