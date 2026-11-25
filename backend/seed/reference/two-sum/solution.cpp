class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<long long, int> indexOf;
        indexOf.reserve(nums.size() * 2);
        for (int i = 0; i < (int)nums.size(); i++) {
            long long need = (long long)target - nums[i];
            auto it = indexOf.find(need);
            if (it != indexOf.end()) return {it->second, i};
            indexOf[nums[i]] = i;
        }
        return {};
    }
};
