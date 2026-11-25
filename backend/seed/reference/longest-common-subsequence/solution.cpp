class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int n = (int)text1.size(), m = (int)text2.size();
        vector<int> prev(m + 1, 0), cur(m + 1, 0);  // dp over prefixes, one row at a time
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                cur[j] = text1[i - 1] == text2[j - 1] ? prev[j - 1] + 1 : max(prev[j], cur[j - 1]);
            }
            swap(prev, cur);
        }
        return prev[m];
    }
};
