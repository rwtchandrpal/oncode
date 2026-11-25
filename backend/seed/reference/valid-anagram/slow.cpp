// O(n^2): for each letter of s, find and erase one matching letter of t.
class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.size() != t.size()) return false;
        for (char c : s) {
            size_t pos = t.find(c);
            if (pos == string::npos) return false;
            t.erase(pos, 1);
        }
        return t.empty();
    }
};
