// Wrong: accepts two-digit codes with a leading zero ("06"). Must be rejected.
class Solution {
public:
    int numDecodings(string s) {
        long long prev2 = 1, prev1 = s[0] == '0' ? 0 : 1;
        for (size_t i = 1; i < s.size(); i++) {
            long long cur = 0;
            if (s[i] != '0') cur += prev1;
            int two = (s[i - 1] - '0') * 10 + (s[i] - '0');
            if (two >= 1 && two <= 26) cur += prev2;
            prev2 = prev1;
            prev1 = cur;
        }
        return (int)prev1;
    }
};
