// Wrong: n - edges, which is only right when the graph has no cycles.
class Solution {
public:
    int countComponents(int n, vector<vector<int>>& edges) { return n - (int)edges.size(); }
};
