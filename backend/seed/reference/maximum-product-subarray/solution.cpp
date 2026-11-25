class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int best = nums[0], hi = nums[0], lo = nums[0];  // largest / smallest product ending here
        for (size_t i = 1; i < nums.size(); i++) {
            int x = nums[i];
            if (x < 0) swap(hi, lo);
            hi = max(x, hi * x);
            lo = min(x, lo * x);
            best = max(best, hi);
        }
        return best;
    }
};
