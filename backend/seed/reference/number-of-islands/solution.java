class Solution {
    // Union-find over land cells (independent of the C++ flood fill).
    private int[] parent;

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    public int numIslands(char[][] grid) {
        int m = grid.length, n = grid[0].length, islands = 0;
        parent = new int[m * n];
        for (int i = 0; i < m * n; i++) parent[i] = i;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != '1') continue;
                islands++;
                int[][] back = {{r - 1, c}, {r, c - 1}}; // neighbours already visited
                for (int[] nb : back) {
                    if (nb[0] < 0 || nb[1] < 0 || grid[nb[0]][nb[1]] != '1') continue;
                    int a = find(r * n + c), b = find(nb[0] * n + nb[1]);
                    if (a != b) {
                        parent[a] = b;
                        islands--;
                    }
                }
            }
        }
        return islands;
    }
}
