class Solution {
    // DFS post-order topological sort with cycle detection (the C++ reference uses Kahn's algorithm).
    private List<Set<Integer>> after;
    private int[] state; // 0 = unvisited, 1 = in progress, 2 = done
    private StringBuilder out;

    private boolean visit(int c) {
        if (state[c] == 1) return false;
        if (state[c] == 2) return true;
        state[c] = 1;
        for (int y : after.get(c)) if (!visit(y)) return false;
        state[c] = 2;
        out.append((char) ('a' + c));
        return true;
    }

    public String alienOrder(String[] words) {
        boolean[] present = new boolean[26];
        for (String w : words) for (char c : w.toCharArray()) present[c - 'a'] = true;
        after = new ArrayList<>();
        for (int c = 0; c < 26; c++) after.add(new HashSet<>());
        for (int i = 1; i < words.length; i++) {
            String a = words[i - 1], b = words[i];
            int k = 0;
            while (k < a.length() && k < b.length() && a.charAt(k) == b.charAt(k)) k++;
            if (k == a.length() || k == b.length()) {
                if (a.length() > b.length()) return "";
                continue;
            }
            after.get(a.charAt(k) - 'a').add(b.charAt(k) - 'a');
        }
        state = new int[26];
        out = new StringBuilder();
        for (int c = 0; c < 26; c++) if (present[c] && !visit(c)) return "";
        return out.reverse().toString();
    }
}
