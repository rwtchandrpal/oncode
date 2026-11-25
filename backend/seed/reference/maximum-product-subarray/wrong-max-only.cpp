// Wrong: tracks only the largest product ending here (Kadane for products), losing negative pairs.
class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int best = nums[0], hi = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            hi = max(nums[i], hi * nums[i]);
            best = max(best, hi);
        }
        return best;
    }
};
