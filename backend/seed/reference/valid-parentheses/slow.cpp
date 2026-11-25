// O(n^2): repeatedly deletes an adjacent matching pair until none is left.
class Solution {
public:
    bool isValid(string s) {
        for (;;) {
            size_t p = s.find("()");
            if (p == string::npos) p = s.find("[]");
            if (p == string::npos) p = s.find("{}");
            if (p == string::npos) break;
            s.erase(p, 2);
        }
        return s.empty();
    }
};
