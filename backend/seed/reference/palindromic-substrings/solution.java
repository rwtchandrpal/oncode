class Solution {
    public int countSubstrings(String s) {
        int n = s.length(), count = 0;
        boolean[][] pal = new boolean[n][n]; // pal[i][j]: s[i..j] is a palindrome
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                pal[i][j] = s.charAt(i) == s.charAt(j) && (j - i < 2 || pal[i + 1][j - 1]);
                if (pal[i][j]) count++;
            }
        }
        return count;
    }
}
