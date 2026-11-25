// Wrong: jumps the left edge to last[c] + 1 even when that moves it backwards ("abba" gives 3).
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> last(256, -1);
        int best = 0, left = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            unsigned char c = s[i];
            if (last[c] >= 0) left = last[c] + 1;
            last[c] = i;
            best = max(best, i - left + 1);
        }
        return best;
    }
};
