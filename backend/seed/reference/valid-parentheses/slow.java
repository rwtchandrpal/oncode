// O(n^2): repeatedly deletes an adjacent matching pair until none is left.
class Solution {
    public boolean isValid(String s) {
        StringBuilder b = new StringBuilder(s);
        for (;;) {
            int p = b.indexOf("()");
            if (p < 0) p = b.indexOf("[]");
            if (p < 0) p = b.indexOf("{}");
            if (p < 0) break;
            b.delete(p, p + 2);
        }
        return b.length() == 0;
    }
}
