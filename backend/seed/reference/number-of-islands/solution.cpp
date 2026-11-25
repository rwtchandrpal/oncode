class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int m = (int)grid.size(), n = (int)grid[0].size(), islands = 0;
        vector<pair<int, int>> stack;  // iterative flood fill
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != '1') continue;
                islands++;
                grid[r][c] = '0';
                stack.push_back({r, c});
                while (!stack.empty()) {
                    int y = stack.back().first, x = stack.back().second;
                    stack.pop_back();
                    const int dy[] = {1, -1, 0, 0}, dx[] = {0, 0, 1, -1};
                    for (int d = 0; d < 4; d++) {
                        int ny = y + dy[d], nx = x + dx[d];
                        if (ny >= 0 && nx >= 0 && ny < m && nx < n && grid[ny][nx] == '1') {
                            grid[ny][nx] = '0';
                            stack.push_back({ny, nx});
                        }
                    }
                }
            }
        }
        return islands;
    }
};
