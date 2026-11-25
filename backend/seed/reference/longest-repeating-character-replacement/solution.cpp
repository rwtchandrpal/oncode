class Solution {
public:
    int characterReplacement(string s, int k) {
        int count[26] = {0};
        int left = 0, maxFreq = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            maxFreq = max(maxFreq, ++count[s[right] - 'A']);
            // window is valid while the letters to change (size - most common) fit in k
            while (right - left + 1 - maxFreq > k) count[s[left++] - 'A']--;
            best = max(best, right - left + 1);
        }
        return best;
    }
};
