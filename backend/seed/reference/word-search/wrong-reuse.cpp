// Wrong: never marks cells as used, so a cell can be read twice ("ABA" on [[A,B],[C,D]]).
class Solution {
    bool dfs(const vector<vector<char>>& b, const string& w, int i, int r, int c) {
        if (i == (int)w.size()) return true;
        if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size() || b[r][c] != w[i]) return false;
        return dfs(b, w, i + 1, r + 1, c) || dfs(b, w, i + 1, r - 1, c) || dfs(b, w, i + 1, r, c + 1) || dfs(b, w, i + 1, r, c - 1);
    }
public:
    bool exist(vector<vector<char>>& board, string word) {
        map<char, int> have;
        for (auto& row : board) for (char ch : row) have[ch]++;
        for (char ch : word) if (!have[ch]) return false;
        for (int r = 0; r < (int)board.size(); r++)
            for (int c = 0; c < (int)board[0].size(); c++)
                if (dfs(board, word, 0, r, c)) return true;
        return false;
    }
};
