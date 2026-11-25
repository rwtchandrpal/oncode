// O(n^2): for each candidate, scan the whole array.
class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int n = (int)nums.size();
        for (int v = 0; v <= n; v++) {
            bool found = false;
            for (int x : nums)
                if (x == v) { found = true; break; }
            if (!found) return v;
        }
        return -1;
    }
};
