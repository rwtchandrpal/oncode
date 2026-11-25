// Wrong: also connects diagonal neighbours.
class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int m = (int)grid.size(), n = (int)grid[0].size(), islands = 0;
        vector<pair<int, int>> st;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != '1') continue;
                islands++;
                grid[r][c] = '0';
                st.push_back({r, c});
                while (!st.empty()) {
                    int y = st.back().first, x = st.back().second;
                    st.pop_back();
                    for (int dy = -1; dy <= 1; dy++)
                        for (int dx = -1; dx <= 1; dx++) {
                            int ny = y + dy, nx = x + dx;
                            if (ny >= 0 && nx >= 0 && ny < m && nx < n && grid[ny][nx] == '1') {
                                grid[ny][nx] = '0';
                                st.push_back({ny, nx});
                            }
                        }
                }
            }
        return islands;
    }
};
