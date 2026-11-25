// Wrong: total product divided by nums[i]; breaks (division by zero) when nums contains 0.
class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        long long total = 1;
        for (int x : nums) total *= x;
        vector<int> answer;
        for (int x : nums) answer.push_back((int)(total / x));
        return answer;
    }
};
