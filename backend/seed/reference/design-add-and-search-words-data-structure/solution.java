class WordDictionary {
    // Words grouped by length; a search scans same-length words (independent of the C++ trie).
    private final Map<Integer, Set<String>> byLength = new HashMap<>();

    public WordDictionary() {
    }

    public void addWord(String word) {
        byLength.computeIfAbsent(word.length(), k -> new HashSet<>()).add(word);
    }

    public boolean search(String word) {
        Set<String> candidates = byLength.get(word.length());
        if (candidates == null) return false;
        if (word.indexOf('.') < 0) return candidates.contains(word);
        for (String c : candidates) {
            boolean ok = true;
            for (int i = 0; i < word.length() && ok; i++) {
                char p = word.charAt(i);
                if (p != '.' && p != c.charAt(i)) ok = false;
            }
            if (ok) return true;
        }
        return false;
    }
}
