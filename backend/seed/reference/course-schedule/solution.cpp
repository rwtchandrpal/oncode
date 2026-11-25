class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        // Kahn's algorithm: repeatedly take a course with no unfinished prerequisites.
        vector<vector<int>> unlocks(numCourses);
        vector<int> pending(numCourses, 0);
        for (auto& p : prerequisites) {
            unlocks[p[1]].push_back(p[0]);
            pending[p[0]]++;
        }
        vector<int> ready;
        for (int c = 0; c < numCourses; c++) if (pending[c] == 0) ready.push_back(c);
        int done = 0;
        while (!ready.empty()) {
            int c = ready.back();
            ready.pop_back();
            done++;
            for (int next : unlocks[c]) if (--pending[next] == 0) ready.push_back(next);
        }
        return done == numCourses;
    }
};
