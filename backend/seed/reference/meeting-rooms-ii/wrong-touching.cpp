// Wrong: does not reuse a room freed exactly when the next meeting starts.
class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        priority_queue<int, vector<int>, greater<int>> ends;
        for (auto& m : intervals) {
            if (!ends.empty() && ends.top() < m[0]) ends.pop();
            ends.push(m[1]);
        }
        return (int)ends.size();
    }
};
