class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> freq;
        for (int x : nums) freq[x]++;
        // bucket sort by frequency: O(n)
        vector<vector<int>> buckets(nums.size() + 1);
        for (auto& p : freq) buckets[p.second].push_back(p.first);
        vector<int> result;
        for (int f = (int)nums.size(); f >= 1 && (int)result.size() < k; f--) {
            for (int v : buckets[f]) {
                if ((int)result.size() < k) result.push_back(v);
            }
        }
        return result;
    }
};
