// Exponential: plain recursion without memoisation.
class Solution {
    int go(const string& s, size_t i) {
        if (i == s.size()) return 1;
        if (s[i] == '0') return 0;
        int ways = go(s, i + 1);
        if (i + 1 < s.size() && (s[i] - '0') * 10 + (s[i + 1] - '0') <= 26) ways += go(s, i + 2);
        return ways;
    }
public:
    int numDecodings(string s) { return go(s, 0); }
};
