// Exponential: plain recursion without memoisation.
class Solution {
    int go(const string& a, const string& b, int i, int j) {
        if (i == (int)a.size() || j == (int)b.size()) return 0;
        if (a[i] == b[j]) return 1 + go(a, b, i + 1, j + 1);
        return max(go(a, b, i + 1, j), go(a, b, i, j + 1));
    }
public:
    int longestCommonSubsequence(string text1, string text2) { return go(text1, text2, 0, 0); }
};
