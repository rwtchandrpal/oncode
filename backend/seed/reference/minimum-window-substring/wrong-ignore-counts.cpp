// Wrong: treats t as a set of letters, ignoring how many times each one is needed.
class Solution {
public:
    string minWindow(string s, string t) {
        bool need[128] = {false};
        int distinct = 0;
        for (char c : t) if (!need[(int)c]) { need[(int)c] = true; distinct++; }
        int have[128] = {0};
        int ok = 0, left = 0, bestStart = 0, bestLen = INT_MAX;
        for (int right = 0; right < (int)s.size(); right++) {
            int c = s[right];
            if (need[c] && have[c]++ == 0) ok++;
            while (ok == distinct) {
                if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; }
                int d = s[left++];
                if (need[d] && --have[d] == 0) ok--;
            }
        }
        return bestLen == INT_MAX ? "" : s.substr(bestStart, bestLen);
    }
};
