class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> words(wordDict.begin(), wordDict.end());
        size_t longest = 0;
        for (const string& w : wordDict) longest = max(longest, w.size());
        int n = (int)s.size();
        vector<bool> ok(n + 1, false);  // ok[i]: the first i characters can be split
        ok[0] = true;
        for (int i = 1; i <= n; i++) {
            for (int k = max(0, i - (int)longest); k < i && !ok[i]; k++) {
                if (ok[k] && words.count(s.substr(k, i - k))) ok[i] = true;
            }
        }
        return ok[n];
    }
};
