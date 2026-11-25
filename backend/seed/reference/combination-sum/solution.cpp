class Solution {
    void search(const vector<int>& c, int start, int remaining, vector<int>& current, vector<vector<int>>& out) {
        if (remaining == 0) {
            out.push_back(current);
            return;
        }
        for (int i = start; i < (int)c.size() && c[i] <= remaining; i++) {
            current.push_back(c[i]);
            search(c, i, remaining - c[i], current, out);  // i, not i + 1: reuse is allowed
            current.pop_back();
        }
    }
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        vector<vector<int>> out;
        vector<int> current;
        search(candidates, 0, target, current, out);
        return out;
    }
};
