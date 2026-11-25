class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = (int)matrix.size();
        // transpose, then mirror each row
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) swap(matrix[i][j], matrix[j][i]);
        for (auto& row : matrix) reverse(row.begin(), row.end());
    }
};
