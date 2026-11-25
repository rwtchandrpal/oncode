// Wrong: always takes the longest jump available. Must be rejected.
class Solution {
public:
    bool canJump(vector<int>& nums) {
        long long i = 0, last = (long long)nums.size() - 1;
        while (i < last) {
            if (nums[i] == 0) return false;
            i += nums[i];
        }
        return true;
    }
};
