// Wrong: ignores the circle (first and last may both be robbed). Must be rejected.
class Solution {
public:
    int rob(vector<int>& nums) {
        int take = 0, skip = 0;
        for (int x : nums) {
            int newTake = skip + x;
            skip = max(skip, take);
            take = newTake;
        }
        return max(take, skip);
    }
};
