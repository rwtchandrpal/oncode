// Exponential: tries robbing / skipping every house without memoisation.
class Solution {
    int best(vector<int>& nums, int i) {
        if (i >= (int)nums.size()) return 0;
        return max(nums[i] + best(nums, i + 2), best(nums, i + 1));
    }
public:
    int rob(vector<int>& nums) { return best(nums, 0); }
};
