// Wrong: only checks the edge count (n - 1), not connectivity or cycles.
class Solution {
public:
    bool validTree(int n, vector<vector<int>>& edges) { return (int)edges.size() == n - 1; }
};
