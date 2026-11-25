// Wrong: only checks that each bracket type is balanced by count, ignoring order. Must be rejected.
class Solution {
public:
    bool isValid(string s) {
        int a = 0, b = 0, c = 0;
        for (char ch : s) {
            if (ch == '(') a++; else if (ch == ')') a--;
            else if (ch == '[') b++; else if (ch == ']') b--;
            else if (ch == '{') c++; else c--;
            if (a < 0 || b < 0 || c < 0) return false;
        }
        return a == 0 && b == 0 && c == 0;
    }
};
