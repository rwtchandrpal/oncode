class Solution {
    struct Node {
        int next[26];
        int word = -1;  // index of the word ending here
        Node() { fill(next, next + 26, -1); }
    };
    vector<Node> trie;
    vector<string> found;

    void dfs(vector<vector<char>>& b, int r, int c, int node, const vector<string>& words) {
        char ch = b[r][c];
        if (ch == '#') return;
        int nxt = trie[node].next[ch - 'a'];
        if (nxt < 0) return;
        if (trie[nxt].word >= 0) {
            found.push_back(words[trie[nxt].word]);
            trie[nxt].word = -1;  // report each word once
        }
        b[r][c] = '#';
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nc >= 0 && nr < (int)b.size() && nc < (int)b[0].size()) dfs(b, nr, nc, nxt, words);
        }
        b[r][c] = ch;
    }
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        trie.assign(1, Node());
        for (int i = 0; i < (int)words.size(); i++) {
            int node = 0;
            for (char ch : words[i]) {
                if (trie[node].next[ch - 'a'] < 0) {
                    trie[node].next[ch - 'a'] = (int)trie.size();
                    trie.emplace_back();
                }
                node = trie[node].next[ch - 'a'];
            }
            trie[node].word = i;
        }
        found.clear();
        for (int r = 0; r < (int)board.size(); r++)
            for (int c = 0; c < (int)board[0].size(); c++) dfs(board, r, c, 0, words);
        return found;
    }
};
