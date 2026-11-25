class Solution {
    private char[][] b;
    private String w;
    private boolean[][] used;

    private boolean dfs(int i, int r, int c) {
        if (i == w.length()) return true;
        if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || used[r][c] || b[r][c] != w.charAt(i)) return false;
        used[r][c] = true;
        boolean found = dfs(i + 1, r + 1, c) || dfs(i + 1, r - 1, c) || dfs(i + 1, r, c + 1) || dfs(i + 1, r, c - 1);
        used[r][c] = false;
        return found;
    }

    public boolean exist(char[][] board, String word) {
        int[] have = new int[128], need = new int[128];
        for (char[] row : board) for (char ch : row) have[ch]++;
        for (char ch : word.toCharArray()) if (++need[ch] > have[ch]) return false;
        if (have[word.charAt(0)] > have[word.charAt(word.length() - 1)]) word = new StringBuilder(word).reverse().toString();
        b = board;
        w = word;
        used = new boolean[board.length][board[0].length];
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                if (dfs(0, r, c)) return true;
        return false;
    }
}
