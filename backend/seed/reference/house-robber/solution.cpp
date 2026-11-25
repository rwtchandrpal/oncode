class Solution {
public:
    int rob(vector<int>& nums) {
        int take = 0, skip = 0;  // best total if the previous house was robbed / not robbed
        for (int x : nums) {
            int newTake = skip + x;
            skip = max(skip, take);
            take = newTake;
        }
        return max(take, skip);
    }
};
