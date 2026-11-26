class Solution {
    // Collect every string readable along a simple path of length <= 10 that is also a prefix of
    // some word (a prefix set prunes the search), then keep the ones that are words.
    private Set<String> prefixes, wordSet, found;
    private char[][] b;
    private boolean[][] used;

    private void dfs(int r, int c, StringBuilder cur) {
        if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || used[r][c]) return;
        cur.append(b[r][c]);
        String s = cur.toString();
        if (prefixes.contains(s)) {
            if (wordSet.contains(s)) found.add(s);
            used[r][c] = true;
            dfs(r + 1, c, cur);
            dfs(r - 1, c, cur);
            dfs(r, c + 1, cur);
            dfs(r, c - 1, cur);
            used[r][c] = false;
        }
        cur.setLength(cur.length() - 1);
    }

    public List<String> findWords(char[][] board, String[] words) {
        prefixes = new HashSet<>();
        wordSet = new HashSet<>(Arrays.asList(words));
        for (String w : words) for (int i = 1; i <= w.length(); i++) prefixes.add(w.substring(0, i));
        found = new HashSet<>();
        b = board;
        used = new boolean[board.length][board[0].length];
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++) dfs(r, c, new StringBuilder());
        return new ArrayList<>(found);
    }
}
