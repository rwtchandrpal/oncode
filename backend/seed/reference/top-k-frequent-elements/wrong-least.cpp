// Wrong: picks the k LEAST frequent values. Must be rejected.
class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        map<int, int> freq;
        for (int x : nums) freq[x]++;
        vector<pair<int, int>> byFreq;
        for (auto& p : freq) byFreq.push_back({p.second, p.first});
        sort(byFreq.begin(), byFreq.end());
        vector<int> result;
        for (int i = 0; i < k; i++) result.push_back(byFreq[i].second);
        return result;
    }
};
