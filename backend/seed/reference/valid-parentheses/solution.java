class Solution {
    public boolean isValid(String s) {
        char[] stack = new char[s.length()];
        int top = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(' || c == '[' || c == '{') {
                stack[top++] = c;
                continue;
            }
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (top == 0 || stack[top - 1] != want) return false;
            top--;
        }
        return top == 0;
    }
}
