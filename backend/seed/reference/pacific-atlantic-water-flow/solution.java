class Solution {
    // BFS from each ocean's border, moving to neighbours that are at least as high.
    private boolean[][] reach(int[][] h, boolean pacific) {
        int m = h.length, n = h[0].length;
        boolean[][] seen = new boolean[m][n];
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) {
                boolean border = pacific ? (r == 0 || c == 0) : (r == m - 1 || c == n - 1);
                if (border) {
                    seen[r][c] = true;
                    queue.add(new int[] {r, c});
                }
            }
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            for (int[] d : dirs) {
                int nr = cell[0] + d[0], nc = cell[1] + d[1];
                if (nr < 0 || nc < 0 || nr >= m || nc >= n || seen[nr][nc] || h[nr][nc] < h[cell[0]][cell[1]]) continue;
                seen[nr][nc] = true;
                queue.add(new int[] {nr, nc});
            }
        }
        return seen;
    }

    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        boolean[][] p = reach(heights, true), a = reach(heights, false);
        List<List<Integer>> out = new ArrayList<>();
        for (int r = 0; r < heights.length; r++)
            for (int c = 0; c < heights[0].length; c++)
                if (p[r][c] && a[r][c]) out.add(Arrays.asList(r, c));
        return out;
    }
}
