// Wrong: DFS with a single "visited" flag treats any revisit (e.g. a diamond) as a loop.
class Solution {
    bool dfs(int c, vector<vector<int>>& needs, vector<char>& visited) {
        if (visited[c]) return false;
        visited[c] = 1;
        for (int d : needs[c]) if (!dfs(d, needs, visited)) return false;
        return true;
    }
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> needs(numCourses);
        for (auto& p : prerequisites) needs[p[0]].push_back(p[1]);
        for (int c = 0; c < numCourses; c++) {
            vector<char> visited(numCourses, 0);
            if (!dfs(c, needs, visited)) return false;
        }
        return true;
    }
};
