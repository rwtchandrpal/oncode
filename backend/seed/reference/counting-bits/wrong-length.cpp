// Wrong: off by one, returns counts for 0..n-1 only. Must be rejected.
class Solution {
public:
    vector<int> countBits(int n) {
        vector<int> ans(n, 0);
        for (int i = 1; i < n; i++) ans[i] = ans[i >> 1] + (i & 1);
        return ans;
    }
};
