// Wrong: two pointers without skipping duplicates, so the same triplet is reported repeatedly.
class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        int n = (int)nums.size();
        for (int i = 0; i < n - 2; i++) {
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int sum = nums[i] + nums[lo] + nums[hi];
                if (sum < 0) lo++;
                else if (sum > 0) hi--;
                else { result.push_back({nums[i], nums[lo], nums[hi]}); lo++; hi--; }
            }
        }
        return result;
    }
};
