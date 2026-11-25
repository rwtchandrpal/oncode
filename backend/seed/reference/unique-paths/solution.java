class Solution {
    public int uniquePaths(int m, int n) {
        // C(m + n - 2, m - 1), computed so every intermediate value is an exact integer
        long result = 1;
        int k = Math.min(m, n) - 1, total = m + n - 2;
        for (int i = 1; i <= k; i++) result = result * (total - k + i) / i;
        return (int) result;
    }
}
