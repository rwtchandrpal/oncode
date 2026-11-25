// Wrong: zeroes rows/columns while scanning, so newly written zeros spread further.
class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        int m = (int)matrix.size(), n = (int)matrix[0].size();
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                if (matrix[r][c] == 0) {
                    for (int k = 0; k < n; k++) matrix[r][k] = 0;
                    for (int k = 0; k < m; k++) matrix[k][c] = 0;
                }
    }
};
