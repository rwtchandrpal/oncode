// Wrong: Kadane that never goes below 0, i.e. allows an empty subarray. Fails when all values are negative.
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int best = 0, current = 0;
        for (int x : nums) {
            current = max(0, current + x);
            best = max(best, current);
        }
        return best;
    }
};
