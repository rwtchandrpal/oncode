class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> last(256, -1);  // last index of each character
        int best = 0, left = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            unsigned char c = s[i];
            left = max(left, last[c] + 1);  // never move the window's left edge backwards
            last[c] = i;
            best = max(best, i - left + 1);
        }
        return best;
    }
};
