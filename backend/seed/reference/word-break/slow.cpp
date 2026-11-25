// Exponential: tries every prefix recursively without memoisation.
class Solution {
    bool go(const string& s, size_t i, const unordered_set<string>& words) {
        if (i == s.size()) return true;
        for (size_t len = 1; i + len <= s.size() && len <= 20; len++) {
            if (words.count(s.substr(i, len)) && go(s, i + len, words)) return true;
        }
        return false;
    }
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> words(wordDict.begin(), wordDict.end());
        return go(s, 0, words);
    }
};
