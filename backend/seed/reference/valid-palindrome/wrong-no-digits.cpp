// Wrong: keeps only letters and drops digits, so "0P" and digit mismatches slip through. Must be rejected.
class Solution {
public:
    bool isPalindrome(string s) {
        string t;
        for (char c : s)
            if (isalpha((unsigned char)c)) t += (char)tolower((unsigned char)c);
        return equal(t.begin(), t.end(), t.rbegin());
    }
};
