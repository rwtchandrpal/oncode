// Wrong: lets water flow only to strictly lower cells (equal heights block it).
class Solution {
    vector<vector<char>> reach(const vector<vector<int>>& h, vector<pair<int, int>> st) {
        int m = (int)h.size(), n = (int)h[0].size();
        vector<vector<char>> seen(m, vector<char>(n, 0));
        for (auto& s : st) seen[s.first][s.second] = 1;
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!st.empty()) {
            int r = st.back().first, c = st.back().second;
            st.pop_back();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nc < 0 || nr >= m || nc >= n || seen[nr][nc] || h[nr][nc] <= h[r][c]) continue;
                seen[nr][nc] = 1;
                st.push_back({nr, nc});
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
