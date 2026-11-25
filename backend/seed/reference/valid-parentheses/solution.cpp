class Solution {
public:
    bool isValid(string s) {
        string stack;
        for (char c : s) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push_back(c);
                continue;
            }
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (stack.empty() || stack.back() != want) return false;
            stack.pop_back();
        }
        return stack.empty();
    }
};
