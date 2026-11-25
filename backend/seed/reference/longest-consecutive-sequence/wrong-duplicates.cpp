// Wrong: sorts, but treats a repeated value as the end of a run. Must be rejected.
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        if (nums.empty()) return 0;
        sort(nums.begin(), nums.end());
        int best = 1, cur = 1;
        for (size_t i = 1; i < nums.size(); i++) {
            cur = ((long long)nums[i] == (long long)nums[i - 1] + 1) ? cur + 1 : 1;
            best = max(best, cur);
        }
        return best;
    }
};
