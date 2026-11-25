// Wrong: only odd-length centres, so even palindromes such as "noon" are missed.
class Solution {
public:
    string longestPalindrome(string s) {
        int n = (int)s.size(), bestStart = 0, bestLen = 1;
        for (int c = 0; c < n; c++) {
            int l = c, r = c;
            while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
            if (r - l - 1 > bestLen) { bestLen = r - l - 1; bestStart = l + 1; }
        }
        return s.substr(bestStart, bestLen);
    }
};
