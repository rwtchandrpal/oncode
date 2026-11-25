// O(n^2): every pair of walls.
class Solution {
public:
    int maxArea(vector<int>& height) {
        int best = 0;
        for (size_t i = 0; i < height.size(); i++)
            for (size_t j = i + 1; j < height.size(); j++)
                best = max(best, min(height[i], height[j]) * (int)(j - i));
        return best;
    }
};
