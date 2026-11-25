// Wrong: only expands around letters, so even-length palindromes like "bb" are missed.
class Solution {
public:
    int countSubstrings(string s) {
        int n = (int)s.size(), count = 0;
        for (int c = 0; c < n; c++) {
            for (int l = c, r = c; l >= 0 && r < n && s[l] == s[r]; l--, r++) count++;
        }
        return count;
    }
};
