// Informational: the common recursive DFS in Java, to check the deepest test fits the JVM stack.
class Solution {
    private void dfs(int[][] h, boolean[][] seen, int r, int c, int prev) {
        if (r < 0 || c < 0 || r >= h.length || c >= h[0].length || seen[r][c] || h[r][c] < prev) return;
        seen[r][c] = true;
        dfs(h, seen, r + 1, c, h[r][c]);
        dfs(h, seen, r - 1, c, h[r][c]);
        dfs(h, seen, r, c + 1, h[r][c]);
        dfs(h, seen, r, c - 1, h[r][c]);
    }

    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        int m = heights.length, n = heights[0].length;
        boolean[][] p = new boolean[m][n], a = new boolean[m][n];
        for (int r = 0; r < m; r++) { dfs(heights, p, r, 0, -1); dfs(heights, a, r, n - 1, -1); }
        for (int c = 0; c < n; c++) { dfs(heights, p, 0, c, -1); dfs(heights, a, m - 1, c, -1); }
        List<List<Integer>> out = new ArrayList<>();
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (p[r][c] && a[r][c]) out.add(Arrays.asList(r, c));
        return out;
    }
}
