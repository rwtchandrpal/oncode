// Wrong: inserts nums[i] into the map before looking up its complement, so it can pair an
// element with itself (e.g. [6,6] with target 12 returns [0,0]). Must be rejected.
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<long long, int> indexOf;
        for (int i = 0; i < (int)nums.size(); i++) {
            indexOf[nums[i]] = i;
            auto it = indexOf.find((long long)target - nums[i]);
            if (it != indexOf.end()) return {it->second, i};
        }
        return {};
    }
};
