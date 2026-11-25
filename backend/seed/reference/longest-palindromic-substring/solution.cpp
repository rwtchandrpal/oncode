class Solution {
public:
    string longestPalindrome(string s) {
        int n = (int)s.size(), bestStart = 0, bestLen = 1;
        for (int center = 0; center < 2 * n - 1; center++) {
            int l = center / 2, r = l + center % 2;
            while (l >= 0 && r < n && s[l] == s[r]) {
                l--;
                r++;
            }
            int len = r - l - 1;
            if (len > bestLen) {
                bestLen = len;
                bestStart = l + 1;
            }
        }
        return s.substr(bestStart, bestLen);
    }
};
