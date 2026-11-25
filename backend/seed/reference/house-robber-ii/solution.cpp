class Solution {
    // Best total for houses lo..hi in a straight line.
    int robLine(const vector<int>& nums, int lo, int hi) {
        int take = 0, skip = 0;
        for (int i = lo; i <= hi; i++) {
            int newTake = skip + nums[i];
            skip = max(skip, take);
            take = newTake;
        }
        return max(take, skip);
    }
public:
    int rob(vector<int>& nums) {
        int n = (int)nums.size();
        if (n == 1) return nums[0];
        // Either the first house is left out, or the last one is.
        return max(robLine(nums, 0, n - 2), robLine(nums, 1, n - 1));
    }
};
