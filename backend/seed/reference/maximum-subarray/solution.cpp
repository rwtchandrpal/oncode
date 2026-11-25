class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int best = nums[0], current = 0;
        for (int x : nums) {
            current = max(x, current + x);  // extend the block or start a new one at x
            best = max(best, current);
        }
        return best;
    }
};
