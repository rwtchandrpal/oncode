// Wrong: reports a word every time it is traced, so words found twice appear twice.
class Solution {
    bool trace(vector<vector<char>>& b, const string& w, size_t i, int r, int c, int& hits) {
        if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size() || b[r][c] != w[i]) return false;
        if (i + 1 == w.size()) { hits++; return true; }
        char ch = b[r][c];
        b[r][c] = '#';
        trace(b, w, i + 1, r + 1, c, hits);
        trace(b, w, i + 1, r - 1, c, hits);
        trace(b, w, i + 1, r, c + 1, hits);
        trace(b, w, i + 1, r, c - 1, hits);
        b[r][c] = ch;
        return hits > 0;
    }
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        vector<string> out;
        for (const string& w : words) {
            int hits = 0;
            for (int r = 0; r < (int)board.size(); r++)
                for (int c = 0; c < (int)board[0].size(); c++) {
                    int before = hits;
                    trace(board, w, 0, r, c, hits);
                    if (hits > before) out.push_back(w);
                }
        }
        return out;
    }
};
