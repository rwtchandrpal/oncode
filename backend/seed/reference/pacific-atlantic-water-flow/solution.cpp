class Solution {
    // Marks every cell water can climb to from the given border cells (reverse flow: up or level).
    vector<vector<char>> reach(const vector<vector<int>>& h, vector<pair<int, int>> starts) {
        int m = (int)h.size(), n = (int)h[0].size();
        vector<vector<char>> seen(m, vector<char>(n, 0));
        for (auto& s : starts) seen[s.first][s.second] = 1;
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!starts.empty()) {
            int r = starts.back().first, c = starts.back().second;
            starts.pop_back();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nc < 0 || nr >= m || nc >= n || seen[nr][nc] || h[nr][nc] < h[r][c]) continue;
                seen[nr][nc] = 1;
                starts.push_back({nr, nc});
            }
        }
        return seen;
    }
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        int m = (int)heights.size(), n = (int)heights[0].size();
        vector<pair<int, int>> pac, atl;
        for (int r = 0; r < m; r++) { pac.push_back({r, 0}); atl.push_back({r, n - 1}); }
        for (int c = 0; c < n; c++) { pac.push_back({0, c}); atl.push_back({m - 1, c}); }
        auto p = reach(heights, pac), a = reach(heights, atl);
        vector<vector<int>> out;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (p[r][c] && a[r][c]) out.push_back({r, c});
        return out;
    }
};
