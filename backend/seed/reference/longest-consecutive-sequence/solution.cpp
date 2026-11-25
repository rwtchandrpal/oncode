class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> values(nums.begin(), nums.end());
        int best = 0;
        for (int x : values) {
            if (values.count(x - 1)) continue;  // only start counting at the beginning of a run
            int length = 1;
            while (values.count(x + length)) length++;
            best = max(best, length);
        }
        return best;
    }
};
