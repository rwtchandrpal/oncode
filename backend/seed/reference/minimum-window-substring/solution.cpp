class Solution {
public:
    string minWindow(string s, string t) {
        int need[128] = {0};
        for (char c : t) need[(int)c]++;
        int missing = (int)t.size(), left = 0, bestStart = 0, bestLen = INT_MAX;
        for (int right = 0; right < (int)s.size(); right++) {
            if (need[(int)s[right]]-- > 0) missing--;  // this character was still needed
            while (missing == 0) {
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestStart = left;
                }
                if (++need[(int)s[left++]] > 0) missing++;  // dropped a needed character
            }
        }
        return bestLen == INT_MAX ? "" : s.substr(bestStart, bestLen);
    }
};
