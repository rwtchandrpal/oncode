class Solution {
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }
public:
    int countComponents(int n, vector<vector<int>>& edges) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        int components = n;
        for (auto& e : edges) {
            int a = find(e[0]), b = find(e[1]);
            if (a != b) {
                parent[a] = b;  // merging two components
                components--;
            }
        }
        return components;
    }
};
