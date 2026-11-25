class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }
public:
    bool validTree(int n, vector<vector<int>>& edges) {
        if ((int)edges.size() != n - 1) return false;  // a tree has exactly n - 1 edges
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        for (auto& e : edges) {
            int a = find(e[0]), b = find(e[1]);
            if (a == b) return false;  // this edge closes a cycle
            parent[a] = b;
        }
        return true;  // n - 1 edges and no cycle => connected
    }
};
