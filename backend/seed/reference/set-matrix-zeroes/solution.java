class Solution {
    public void setZeroes(int[][] matrix) {
        // O(m + n) extra space: remember which rows and columns contain a zero.
        int m = matrix.length, n = matrix[0].length;
        boolean[] zeroRow = new boolean[m], zeroCol = new boolean[n];
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (matrix[r][c] == 0) { zeroRow[r] = true; zeroCol[c] = true; }
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (zeroRow[r] || zeroCol[c]) matrix[r][c] = 0;
    }
}
