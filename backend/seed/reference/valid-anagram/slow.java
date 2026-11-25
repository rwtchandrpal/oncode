// O(n^2): for each letter of s, find and remove one matching letter of t.
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        StringBuilder rest = new StringBuilder(t);
        for (int i = 0; i < s.length(); i++) {
            int pos = rest.indexOf(String.valueOf(s.charAt(i)));
            if (pos < 0) return false;
            rest.deleteCharAt(pos);
        }
        return rest.length() == 0;
    }
}
