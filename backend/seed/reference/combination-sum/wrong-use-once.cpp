// Wrong: uses each candidate at most once.
class Solution {
    void search(const vector<int>& c, int start, int remaining, vector<int>& cur, vector<vector<int>>& out) {
        if (remaining == 0) { out.push_back(cur); return; }
        for (int i = start; i < (int)c.size() && c[i] <= remaining; i++) {
            cur.push_back(c[i]);
            search(c, i + 1, remaining - c[i], cur, out);
            cur.pop_back();
        }
    }
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        vector<vector<int>> out;
        vector<int> cur;
        search(candidates, 0, target, cur, out);
        return out;
    }
};
